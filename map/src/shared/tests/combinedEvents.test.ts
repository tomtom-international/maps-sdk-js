import type { LayerSpecification, MapGeoJSONFeature } from 'maplibre-gl';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { AnyMapModule } from '../AbstractEventProxy';
import { CombinedEvents } from '../CombinedEvents';
import type { EventsProxy } from '../EventsProxy';
import type { ResolvedEventScope } from '../eventScope';
import { ModuleEvents } from '../ModuleEvents';
import type { StyleSourceWithLayers } from '../SourceWithLayers';
import type { EventHandlerConfig } from '../types';
import { UserEvents } from '../UserEvents';

// Stands in for the module registering a handler: handlers are found again by owner identity.
const owner = {} as AnyMapModule;

type Config = { visible?: boolean };
type Shown = { count: number };
type LayerScope = { layerGroups: string[] };

const layerSpec = (id: string): LayerSpecification => ({ id, type: 'symbol', source: 'SOURCE_ID' });

const source = {
    source: { id: 'SOURCE_ID' },
    _layerSpecs: [{ id: 'layer0', type: 'symbol', source: 'SOURCE_ID' }],
} as unknown as StyleSourceWithLayers;

describe('CombinedEvents', () => {
    let eventProxy: EventsProxy;
    let configChangeHandlers: ((config: Config | undefined) => void)[];
    let shownFeaturesHandlers: ((features: Shown) => void)[];
    let events: CombinedEvents<MapGeoJSONFeature, Config, Shown, LayerScope>;
    let scopeResolver: (scope: LayerScope) => ResolvedEventScope;

    beforeEach(() => {
        eventProxy = {
            addEventHandler: vi.fn(),
            removeHandler: vi.fn(),
            remove: vi.fn(),
        } as unknown as EventsProxy;
        configChangeHandlers = [];
        shownFeaturesHandlers = [];
        scopeResolver = vi.fn((scope: LayerScope) => ({
            layerFilter: (layer: LayerSpecification) => scope.layerGroups.includes(layer.id),
        }));
        events = new CombinedEvents<MapGeoJSONFeature, Config, Shown, LayerScope>(
            new UserEvents<MapGeoJSONFeature, LayerScope>({
                eventProxy,
                sourcesWithLayers: [source],
                owner,
                config: { cursorOnHover: 'pointer' },
                scopeResolver,
            }),
            new ModuleEvents<Config, Shown>(configChangeHandlers, shownFeaturesHandlers),
        );
    });

    describe('on', () => {
        test('routes a user event type to the user events instance', () => {
            const handler = vi.fn();

            events.on('click', handler);

            expect(eventProxy.addEventHandler).toHaveBeenCalledWith(source, handler, 'click', {
                config: { cursorOnHover: 'pointer' },
                owner,
                scope: undefined,
            });
        });

        test('routes config-change to the module events instance and returns its unsubscribe', () => {
            const handler = vi.fn();

            const unsubscribe = events.on('config-change', handler);
            expect(configChangeHandlers).toEqual([handler]);

            unsubscribe();
            expect(configChangeHandlers).toEqual([]);
        });

        test('routes shown-features to the module events instance and returns its unsubscribe', () => {
            const handler = vi.fn();

            const unsubscribe = events.on('shown-features', handler);
            expect(shownFeaturesHandlers).toEqual([handler]);

            unsubscribe();
            expect(shownFeaturesHandlers).toEqual([]);
        });
    });

    describe('off', () => {
        test('clears every handler of a lifecycle type without touching the other', () => {
            events.on('config-change', vi.fn());
            events.on('config-change', vi.fn());
            events.on('shown-features', vi.fn());

            events.off('config-change');

            expect(configChangeHandlers).toEqual([]);
            expect(shownFeaturesHandlers).toHaveLength(1);
        });

        test('clears shown-features handlers', () => {
            events.on('shown-features', vi.fn());

            events.off('shown-features');

            expect(shownFeaturesHandlers).toEqual([]);
        });

        test('delegates a user event type to the proxy rather than the lifecycle handlers', () => {
            events.on('config-change', vi.fn());

            events.off('hover');

            expect(eventProxy.remove).toHaveBeenCalledWith(source, 'hover', owner);
            // Lifecycle handlers are a separate family and must survive.
            expect(configChangeHandlers).toHaveLength(1);
        });
    });

    describe('where', () => {
        test('returns a narrowed UserEvents, leaving the module-wide surface alone', () => {
            const scoped = events.where({ layerGroups: ['layer0'] });

            expect(scoped).toBeInstanceOf(UserEvents);
            expect(scopeResolver).toHaveBeenCalledWith({ layerGroups: ['layer0'] });
        });

        test('registers scoped handlers with the resolved scope', () => {
            const handler = vi.fn();

            events.where({ layerGroups: ['layer0'] }).on('click', handler);

            const { scope } = (eventProxy.addEventHandler as ReturnType<typeof vi.fn>).mock.calls[0][3] as {
                scope?: ResolvedEventScope;
            };
            expect(scope?.layerFilter?.(layerSpec('layer0'))).toBe(true);
            expect(scope?.layerFilter?.(layerSpec('other'))).toBe(false);
        });

        test('passes a per-scope event config through, so scopes can differ in cursor', () => {
            events.where({ layerGroups: ['layer0'] }, { cursorOnHover: 'crosshair' }).on('click', vi.fn());

            const { config } = (eventProxy.addEventHandler as ReturnType<typeof vi.fn>).mock.calls[0][3] as {
                config?: EventHandlerConfig;
            };
            expect(config).toEqual({ cursorOnHover: 'crosshair' });
        });

        test('accepts a bare feature predicate as well as the module scope object', () => {
            const feature = { properties: { magnitude: 'major' } } as unknown as MapGeoJSONFeature;

            events.where((candidate) => candidate.properties.magnitude === 'major').on('click', vi.fn());

            const { scope } = (eventProxy.addEventHandler as ReturnType<typeof vi.fn>).mock.calls[0][3] as {
                scope?: ResolvedEventScope;
            };
            expect(scope?.featureMatches?.(feature)).toBe(true);
            expect(scope?.layerFilter).toBeUndefined();
        });
    });
});
