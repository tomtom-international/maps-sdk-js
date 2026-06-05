import type { Feature } from 'geojson';
import type { MapGeoJSONFeature, Map as MapLibreMap } from 'maplibre-gl';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { EventsProxy } from '../EventsProxy';
import { GeoJSONSourceWithLayers } from '../SourceWithLayers';

const PLACES = 'places';
const layerSpecs = [{ id: 'layer0', type: 'symbol' } as never, { id: 'layer1', type: 'symbol' } as never];

// Two cached originals; `cachedOnly` exists ONLY on the cached copy, so seeing it in a
// dispatched feature proves the proxy substituted the cached original for the raw render.
const cachedAlpha = {
    type: 'Feature',
    id: 'p1',
    properties: { id: 'p1', name: 'Alpha', cachedOnly: true },
    geometry: { type: 'Point', coordinates: [0, 0] },
};

// Raw queryRenderedFeatures result at the point: the same feature across two layers (a
// dedupe case) plus a foreign-source hit (a scope case).
const rawP1Icon = { id: 'p1', source: PLACES, layer: { id: 'layer0' }, properties: { id: 'p1', name: 'Alpha' } };
const rawP1Text = { id: 'p1', source: PLACES, layer: { id: 'layer1' }, properties: { id: 'p1', name: 'Alpha' } };
const rawForeign = { id: 'r1', source: 'vectorTiles', layer: { id: 'roads' }, properties: {} };
const RAW = [rawP1Icon, rawP1Text, rawForeign] as unknown as MapGeoJSONFeature[];

const makeMap = () => {
    const listeners: Record<string, ((ev: unknown) => void)[]> = {};
    const queryRenderedFeatures = vi.fn().mockReturnValue(RAW);
    const map = {
        on: vi.fn((type: string, cb: (ev: unknown) => void) => {
            (listeners[type] ??= []).push(cb);
        }),
        getCanvas: () => ({ style: { cursor: '' } }),
        isMoving: () => false,
        queryRenderedFeatures,
        getSource: vi.fn().mockReturnValue({ id: PLACES, setData: vi.fn() }),
        addSource: vi.fn(),
        getLayer: vi.fn().mockReturnValue({ id: 'layer0' }),
        addLayer: vi.fn(),
        removeLayer: vi.fn(),
        setLayoutProperty: vi.fn(),
        moveLayer: vi.fn(),
    } as unknown as MapLibreMap;
    const fire = (type: string, ev: unknown) => (listeners[type] ?? []).forEach((cb) => cb(ev));
    return { map, fire, queryRenderedFeatures };
};

const makePlacesSource = (map: MapLibreMap) => {
    const swl = new GeoJSONSourceWithLayers(map, PLACES, layerSpecs);
    swl.show({ type: 'FeatureCollection', features: [structuredClone(cachedAlpha)] } as never);
    return swl;
};

const move = { point: { x: 10, y: 10 }, lngLat: { lng: 1, lat: 2 } };

describe('EventsProxy', () => {
    let fireLongHoverTimer: (() => void) | undefined;
    beforeEach(() => {
        // The proxy schedules long-hover via window timers; node test env has no window.
        // Capture the scheduled callback so tests can fire the long-hover timer deterministically.
        fireLongHoverTimer = undefined;
        vi.stubGlobal('window', {
            setTimeout: vi.fn((cb: () => void) => {
                fireLongHoverTimer = cb;
                return 1;
            }),
            clearTimeout: vi.fn(),
        });
    });
    afterEach(() => vi.unstubAllGlobals());

    test('findById miss → handler receives the raw rendered feature (no substitution)', () => {
        const { map, fire, queryRenderedFeatures } = makeMap();
        const proxy = new EventsProxy(map, { precisionMode: 'point' });
        const swl = makePlacesSource(map); // cache holds only id 'p1'
        // A hit from the GeoJSON source whose id is NOT in the cache (e.g. a clustered leaf
        // whose promoted id didn't resolve). Substitution must fall back to the raw feature.
        const ghost = {
            id: 'ghost',
            source: PLACES,
            layer: { id: 'layer0' },
            properties: { id: 'ghost', name: 'Ghost' },
        };
        queryRenderedFeatures.mockReturnValue([ghost]);
        const onClick = vi.fn();
        proxy.addEventHandler(swl, onClick, 'click', undefined);

        fire('click', move);

        const [topFeature, , allEventFeatures] = onClick.mock.calls[0] as [Feature, unknown, Feature[]];
        expect(topFeature).toBe(ghost); // the exact raw MapGeoJSONFeature, passed through
        expect((topFeature.properties as { cachedOnly?: boolean }).cachedOnly).toBeUndefined();
        expect(allEventFeatures).toEqual([ghost]);
    });

    test('clustered source: synthetic top-level id still substitutes + highlights via properties.id', () => {
        const { map, fire, queryRenderedFeatures } = makeMap();
        const proxy = new EventsProxy(map, { precisionMode: 'point' });
        const swl = makePlacesSource(map); // cache: real id 'p1'
        // A clustered-source leaf: clustering drops promoteId, so MapLibre gives it a synthetic
        // numeric top-level id, while the real id stays in properties.id.
        const clusteredLeaf = {
            id: 0,
            source: PLACES,
            layer: { id: 'layer0' },
            properties: { id: 'p1', name: 'Alpha' },
        };
        queryRenderedFeatures.mockReturnValue([clusteredLeaf]);
        const onClick = vi.fn();
        proxy.addEventHandler(swl, onClick, 'click', undefined);

        fire('click', move);

        const [topFeature] = onClick.mock.calls[0] as [Feature];
        // resolved via properties.id → typed cached original, not the raw stringified leaf
        expect((topFeature.properties as { cachedOnly?: boolean }).cachedOnly).toBe(true);
        // …and the click highlight landed on the cached feature (keyed by the real id)
        expect((swl.shownFeatures.features[0].properties as { eventState?: string }).eventState).toBe('click');
    });

    test('click: allEventFeatures is scoped + de-duplicated, [0] === topFeature, and substituted', () => {
        const { map, fire } = makeMap();
        const proxy = new EventsProxy(map, { precisionMode: 'point' });
        const swl = makePlacesSource(map);
        const onClick = vi.fn();
        proxy.addEventHandler(swl, onClick, 'click', undefined);

        fire('click', move);

        expect(onClick).toHaveBeenCalledTimes(1);
        const [topFeature, lngLat, allEventFeatures] = onClick.mock.calls[0] as [Feature, unknown, Feature[]];
        // 2 layer-dupes collapsed + foreign source dropped → exactly one entry.
        expect(allEventFeatures).toHaveLength(1);
        // substituted cached original (raw render never carried `cachedOnly`).
        expect((allEventFeatures[0].properties as { cachedOnly?: boolean }).cachedOnly).toBe(true);
        expect(topFeature).toBe(allEventFeatures[0]);
        expect(lngLat).toEqual(move.lngLat);
    });

    test('hover with a hover handler: substitutes (findById invoked) and scopes/dedupes', () => {
        const { map, fire } = makeMap();
        const proxy = new EventsProxy(map, { precisionMode: 'point' });
        const swl = makePlacesSource(map);
        const findById = vi.spyOn(swl, 'findById');
        const onHover = vi.fn();
        proxy.addEventHandler(swl, vi.fn(), 'click', undefined);
        proxy.addEventHandler(swl, onHover, 'hover', undefined);

        fire('mousemove', move);

        expect(onHover).toHaveBeenCalledTimes(1);
        const [, , allEventFeatures] = onHover.mock.calls[0] as [Feature, unknown, Feature[]];
        expect(allEventFeatures).toHaveLength(1);
        expect((allEventFeatures[0].properties as { cachedOnly?: boolean }).cachedOnly).toBe(true);
        expect(findById).toHaveBeenCalled();
    });

    test('hover with NO hover/hover-move handler does no substitution', () => {
        const { map, fire } = makeMap();
        const proxy = new EventsProxy(map, { precisionMode: 'point' });
        const swl = makePlacesSource(map);
        const findById = vi.spyOn(swl, 'findById');
        // Only a click handler — hover state is still tracked (cursor/eventState) but no
        // hover handler consumes allEventFeatures, so it must not be built.
        proxy.addEventHandler(swl, vi.fn(), 'click', undefined);

        fire('mousemove', move); // hover-changed (enter)
        fire('mousemove', { point: { x: 13, y: 14 }, lngLat: move.lngLat }); // motion over same feature

        expect(findById).not.toHaveBeenCalled();
    });

    test('click with no click handler does no substitution', () => {
        const { map, fire } = makeMap();
        const proxy = new EventsProxy(map, { precisionMode: 'point' });
        const swl = makePlacesSource(map);
        // The source is interactive (has a hover handler) but has no click handler.
        proxy.addEventHandler(swl, vi.fn(), 'hover', undefined);
        const findById = vi.spyOn(swl, 'findById');

        fire('click', move);

        expect(findById).not.toHaveBeenCalled();
    });

    test('long-hover with no long-hover handler does no substitution', () => {
        const { map, fire } = makeMap();
        const proxy = new EventsProxy(map, { precisionMode: 'point' });
        const swl = makePlacesSource(map);
        proxy.addEventHandler(swl, vi.fn(), 'click', undefined); // interactive, but no long-hover handler
        const findById = vi.spyOn(swl, 'findById');

        fire('mousemove', move); // schedules the long-hover timer
        expect(fireLongHoverTimer).toBeDefined();
        fireLongHoverTimer?.(); // fire it

        expect(findById).not.toHaveBeenCalled();
    });

    test('long-hover with a long-hover handler substitutes and dispatches', () => {
        const { map, fire } = makeMap();
        const proxy = new EventsProxy(map, { precisionMode: 'point' });
        const swl = makePlacesSource(map);
        const onLongHover = vi.fn();
        proxy.addEventHandler(swl, onLongHover, 'long-hover', undefined);

        fire('mousemove', move); // schedules the long-hover timer
        fireLongHoverTimer?.();

        expect(onLongHover).toHaveBeenCalledTimes(1);
        const [, , allEventFeatures] = onLongHover.mock.calls[0] as [Feature, unknown, Feature[]];
        expect(allEventFeatures).toHaveLength(1);
        expect((allEventFeatures[0].properties as { cachedOnly?: boolean }).cachedOnly).toBe(true);
    });

    test('clicking a hover-only module writes no sticky `click` eventState (hover still highlights)', () => {
        const { map, fire } = makeMap();
        const proxy = new EventsProxy(map, { precisionMode: 'point' });
        const swl = makePlacesSource(map);
        // Interactive via hover only — it never opted into click selection.
        proxy.addEventHandler(swl, vi.fn(), 'hover', undefined);
        const eventState = () =>
            (swl.shownFeatures.features[0].properties as { eventState?: string } | null)?.eventState;

        fire('click', move);
        // No high-priority click marker should be applied to a module that has no click handler.
        expect(eventState()).toBeUndefined();

        fire('mousemove', move);
        // …so a later hover can still highlight it (would be blocked if `click` had stuck).
        expect(eventState()).toBe('hover');
    });
});
