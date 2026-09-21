import type { LayerSpecification, LngLat, MapGeoJSONFeature } from 'maplibre-gl';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { AnyMapModule } from '../AbstractEventProxy';
import type { EventsProxy } from '../EventsProxy';
import type { ResolvedEventScope } from '../eventScope';
import type { StyleSourceWithLayers } from '../SourceWithLayers';
import type { EventHandlerConfig, UserEventHandler } from '../types';
import { UserEvents } from '../UserEvents';

// Stands in for the module registering a handler: handlers are found again by owner identity.
const owner = {} as AnyMapModule;

const lngLat = { lng: 4.9, lat: 52.37 } as LngLat;

const source = {
    source: { id: 'SOURCE_ID' },
    _layerSpecs: [{ id: 'roadLabels', type: 'symbol', source: 'SOURCE_ID' }] as LayerSpecification[],
} as unknown as StyleSourceWithLayers;

type Incident = { magnitude: string };

const incident = (magnitude: string) => ({ properties: { magnitude } }) as unknown as MapGeoJSONFeature;
const toIncident = (feature: MapGeoJSONFeature): Incident => ({ magnitude: feature.properties.magnitude });

// The last handler the proxy was given, plus the scope and config it was registered with.
type Registration = {
    handler: UserEventHandler<any>;
    config: EventHandlerConfig | undefined;
    scope: ResolvedEventScope | undefined;
};

describe('UserEvents.where', () => {
    let eventProxy: EventsProxy;
    let registrations: Registration[];

    const lastRegistration = () => registrations.at(-1) as Registration;

    beforeEach(() => {
        registrations = [];
        eventProxy = {
            addEventHandler: vi.fn(
                (
                    _sourceWithLayers: StyleSourceWithLayers,
                    handler: UserEventHandler<any>,
                    _type: string,
                    registration: { config?: EventHandlerConfig; scope?: ResolvedEventScope },
                ) => {
                    registrations.push({ handler, config: registration.config, scope: registration.scope });
                },
            ),
            removeHandler: vi.fn(),
            remove: vi.fn(),
        } as unknown as EventsProxy;
    });

    const incidentEvents = () =>
        new UserEvents<Incident>({ eventProxy, sourcesWithLayers: [source], owner, mapping: toIncident });

    test('does not call the handler when nothing under the pointer matches', () => {
        const handler = vi.fn();
        incidentEvents()
            .where((candidate) => candidate.magnitude === 'major')
            .on('click', handler);

        lastRegistration().handler(incident('minor'), lngLat, [incident('minor')], source);

        expect(handler).not.toHaveBeenCalled();
    });

    test('promotes the first matching feature when the top hit is out of scope', () => {
        // Clicking a stack whose top hit is minor and whose second is major must still reach a
        // major-only handler, with the major incident as the primary feature.
        const handler = vi.fn();
        incidentEvents()
            .where((candidate) => candidate.magnitude === 'major')
            .on('click', handler);

        const stack = [incident('minor'), incident('major'), incident('unknown')];
        lastRegistration().handler(stack[0], lngLat, stack, source);

        expect(handler).toHaveBeenCalledWith({ magnitude: 'major' }, lngLat, [{ magnitude: 'major' }], source);
    });

    test('applies the module mapping before the predicate sees the feature', () => {
        // The predicate is written against the module's feature type, not MapLibre's.
        const predicate = vi.fn((candidate: Incident) => candidate.magnitude === 'major');
        incidentEvents().where(predicate).on('click', vi.fn());

        lastRegistration().handler(incident('major'), lngLat, [incident('major')], source);

        expect(predicate).toHaveBeenCalledWith({ magnitude: 'major' });
    });

    test('chained wheres narrow cumulatively', () => {
        const handler = vi.fn();
        incidentEvents()
            .where((candidate) => candidate.magnitude !== 'unknown')
            .where((candidate) => candidate.magnitude !== 'minor')
            .on('click', handler);

        const stack = [incident('unknown'), incident('minor'), incident('major')];
        lastRegistration().handler(stack[0], lngLat, stack, source);

        expect(handler).toHaveBeenCalledWith({ magnitude: 'major' }, lngLat, [{ magnitude: 'major' }], source);
    });

    test('gives each scope its own event config, so scopes can differ in hover cursor', () => {
        const events = new UserEvents<MapGeoJSONFeature>({
            eventProxy,
            sourcesWithLayers: [source],
            owner,
            config: { cursorOnHover: 'pointer' },
        });

        events.where(() => true, { cursorOnHover: 'crosshair' }).on('click', vi.fn());
        expect(lastRegistration().config).toEqual({ cursorOnHover: 'crosshair' });

        // Without its own config a scope inherits the module's.
        events.where(() => true).on('click', vi.fn());
        expect(lastRegistration().config).toEqual({ cursorOnHover: 'pointer' });
    });

    test('leaves the original events untouched', () => {
        const events = incidentEvents();
        const scoped = events.where((candidate) => candidate.magnitude === 'major');

        expect(scoped).not.toBe(events);

        const unscopedHandler = vi.fn();
        events.on('click', unscopedHandler);
        lastRegistration().handler(incident('minor'), lngLat, [incident('minor')], source);

        expect(unscopedHandler).toHaveBeenCalled();
    });

    test('resolves a module-specific scope object through the module resolver', () => {
        const roadLabelsFilter = (layer: LayerSpecification) => layer.id === 'roadLabels';
        const events = new UserEvents<MapGeoJSONFeature, { layerGroups: string[] }>({
            eventProxy,
            sourcesWithLayers: [source],
            owner,
            scopeResolver: (scope) => ({
                layerFilter: scope.layerGroups.includes('roadLabels') ? roadLabelsFilter : () => false,
            }),
        });

        events.where({ layerGroups: ['roadLabels'] }).on('click', vi.fn());

        expect(lastRegistration().scope?.layerFilter).toBe(roadLabelsFilter);
    });

    test('rejects a scope object on a module that only supports feature predicates', () => {
        const events = new UserEvents<MapGeoJSONFeature, { layerGroups: string[] }>({
            eventProxy,
            sourcesWithLayers: [source],
            owner,
        });

        expect(() => events.where({ layerGroups: ['roadLabels'] })).toThrow(
            'This module supports only feature predicates in events.where().',
        );
    });
    // `where` returns a new instance rather than narrowing this one in place. Callers hold
    // `events` and narrow it more than once, so mutating would make the second `where` mean
    // "first AND second" and leave the surface it came from silently scoped. See LSI-159.
    test('two where() calls off one held reference stay independent', () => {
        const events = new UserEvents<MapGeoJSONFeature>({ eventProxy, sourcesWithLayers: [source], owner });

        events.where((f) => f.properties.name === 'a').on('click', vi.fn());
        const first = lastRegistration().scope;
        events.where((f) => f.properties.name === 'b').on('click', vi.fn());
        const second = lastRegistration().scope;
        events.on('click', vi.fn());
        const unscoped = lastRegistration().scope;

        const named = (name: string) => ({ properties: { name } }) as unknown as MapGeoJSONFeature;
        expect(first?.featureMatches?.(named('a'))).toBe(true);
        expect(first?.featureMatches?.(named('b'))).toBe(false);
        expect(second?.featureMatches?.(named('b'))).toBe(true);
        expect(second?.featureMatches?.(named('a'))).toBe(false);
        // The surface they were narrowed from is still unscoped.
        expect(unscoped).toBeUndefined();
    });

    test("a scope's config does not leak back onto the surface it came from", () => {
        const events = new UserEvents<MapGeoJSONFeature>({
            eventProxy,
            sourcesWithLayers: [source],
            owner,
            config: { cursorOnHover: 'pointer' },
        });

        events.where(() => true, { cursorOnHover: 'crosshair' }).on('click', vi.fn());
        expect(lastRegistration().config).toEqual({ cursorOnHover: 'crosshair' });

        events.on('click', vi.fn());
        expect(lastRegistration().config).toEqual({ cursorOnHover: 'pointer' });
    });
});
