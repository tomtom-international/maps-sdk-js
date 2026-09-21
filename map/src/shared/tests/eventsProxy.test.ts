import type { Feature } from 'geojson';
import type { MapGeoJSONFeature, Map as MapLibreMap } from 'maplibre-gl';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { AnyMapModule } from '../AbstractEventProxy';
import { EventsProxy } from '../EventsProxy';
import { GeoJSONSourceWithLayers } from '../SourceWithLayers';

const PLACES = 'places';
// Stands in for the module registering a handler: handlers are found again by owner identity.
const owner = {} as AnyMapModule;
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
    // One canvas for the life of the map, as MapLibre does: the proxy captures it in its
    // constructor, so a fresh object per call would hide every cursor change from the test.
    const canvas = { style: { cursor: '' } } as HTMLCanvasElement;
    const map = {
        on: vi.fn((type: string, cb: (ev: unknown) => void) => {
            (listeners[type] ??= []).push(cb);
        }),
        getCanvas: () => canvas,
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
    return { map, fire, queryRenderedFeatures, canvas };
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
        // Mouse moves are coalesced into one animation frame. Running the frame synchronously
        // keeps these tests reading as "move, then assert"; the coalescing itself is covered by
        // its own test below, which counts frames instead.
        vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
            cb(0);
            return 1;
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
        proxy.addEventHandler(swl, onClick, 'click', { owner });

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
        proxy.addEventHandler(swl, onClick, 'click', { owner });

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
        proxy.addEventHandler(swl, onClick, 'click', { owner });

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
        proxy.addEventHandler(swl, vi.fn(), 'click', { owner });
        proxy.addEventHandler(swl, onHover, 'hover', { owner });

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
        proxy.addEventHandler(swl, vi.fn(), 'click', { owner });

        fire('mousemove', move); // hover-changed (enter)
        fire('mousemove', { point: { x: 13, y: 14 }, lngLat: move.lngLat }); // motion over same feature

        expect(findById).not.toHaveBeenCalled();
    });

    test('click with no click handler does no substitution', () => {
        const { map, fire } = makeMap();
        const proxy = new EventsProxy(map, { precisionMode: 'point' });
        const swl = makePlacesSource(map);
        // The source is interactive (has a hover handler) but has no click handler.
        proxy.addEventHandler(swl, vi.fn(), 'hover', { owner });
        const findById = vi.spyOn(swl, 'findById');

        fire('click', move);

        expect(findById).not.toHaveBeenCalled();
    });

    test('long-hover with no long-hover handler does no substitution', () => {
        const { map, fire } = makeMap();
        const proxy = new EventsProxy(map, { precisionMode: 'point' });
        const swl = makePlacesSource(map);
        proxy.addEventHandler(swl, vi.fn(), 'click', { owner }); // interactive, but no long-hover handler
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
        proxy.addEventHandler(swl, onLongHover, 'long-hover', { owner });

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
        proxy.addEventHandler(swl, vi.fn(), 'hover', { owner });
        const eventState = () =>
            (swl.shownFeatures.features[0].properties as { eventState?: string } | null)?.eventState;

        fire('click', move);
        // No high-priority click marker should be applied to a module that has no click handler.
        expect(eventState()).toBeUndefined();

        fire('mousemove', move);
        // …so a later hover can still highlight it (would be blocked if `click` had stuck).
        expect(eventState()).toBe('hover');
    });

    describe('map interaction plumbing', () => {
        test('a disabled proxy handles neither hover nor click', () => {
            const { map, fire } = makeMap();
            const proxy = new EventsProxy(map, { precisionMode: 'point' });
            const swl = makePlacesSource(map);
            const onClick = vi.fn();
            const onHover = vi.fn();
            proxy.addEventHandler(swl, onClick, 'click', { owner });
            proxy.addEventHandler(swl, onHover, 'hover', { owner });

            proxy.enable(false);
            fire('mousemove', move);
            fire('click', move);

            expect(onHover).not.toHaveBeenCalled();
            expect(onClick).not.toHaveBeenCalled();

            proxy.enable(true);
            fire('click', move);
            expect(onClick).toHaveBeenCalledTimes(1);
        });

        test('contextmenu dispatches through the same path as click', () => {
            const { map, fire } = makeMap();
            const proxy = new EventsProxy(map, { precisionMode: 'point' });
            const swl = makePlacesSource(map);
            const onContextMenu = vi.fn();
            proxy.addEventHandler(swl, onContextMenu, 'contextmenu', { owner });

            fire('contextmenu', move);

            expect(onContextMenu).toHaveBeenCalledTimes(1);
            const [topFeature] = onContextMenu.mock.calls[0] as [Feature];
            expect((topFeature.properties as { cachedOnly?: boolean }).cachedOnly).toBe(true);
        });

        test('mouseover is handled like mousemove', () => {
            const { map, fire } = makeMap();
            const proxy = new EventsProxy(map, { precisionMode: 'point' });
            const swl = makePlacesSource(map);
            const onHover = vi.fn();
            proxy.addEventHandler(swl, onHover, 'hover', { owner });

            fire('mouseover', move);

            expect(onHover).toHaveBeenCalledTimes(1);
        });

        test('mousedown swaps in the drag cursor and mouseup restores what was there', () => {
            const { map, fire, canvas } = makeMap();
            const proxy = new EventsProxy(map, { cursorOnMouseDown: 'grabbing', cursorOnMap: 'default' });
            canvas.style.cursor = 'pointer';

            fire('mousedown', {});
            expect(canvas.style.cursor).toBe('grabbing');

            fire('mouseup', {});
            expect(canvas.style.cursor).toBe('pointer');

            // Dragging feedback is not gated by `enable`, which only suppresses hover and click.
            proxy.enable(false);
            fire('mousedown', {});
            expect(canvas.style.cursor).toBe('grabbing');
        });

        test('the cursor returns to the map default once nothing is hovered', () => {
            const { map, fire, queryRenderedFeatures, canvas } = makeMap();
            const proxy = new EventsProxy(map, { precisionMode: 'point', cursorOnMap: 'default' });
            const swl = makePlacesSource(map);
            proxy.addEventHandler(swl, vi.fn(), 'hover', { owner });

            fire('mousemove', move);
            expect(canvas.style.cursor).toBe('pointer');

            // Moving off every feature: the hover ends and the cursor goes back.
            queryRenderedFeatures.mockReturnValue([]);
            fire('mousemove', { point: { x: 400, y: 400 }, lngLat: move.lngLat });
            expect(canvas.style.cursor).toBe('default');
        });

        test('movestart and mouseout cancel a pending long hover', () => {
            const { map, fire } = makeMap();
            const proxy = new EventsProxy(map, { precisionMode: 'point' });
            const swl = makePlacesSource(map);
            const onLongHover = vi.fn();
            proxy.addEventHandler(swl, onLongHover, 'long-hover', { owner });
            const clearTimeout = (globalThis as unknown as { window: { clearTimeout: ReturnType<typeof vi.fn> } })
                .window.clearTimeout;

            fire('mousemove', move);
            const clearedBefore = clearTimeout.mock.calls.length;

            fire('movestart', {});
            fire('mouseout', {});

            expect(clearTimeout.mock.calls.length).toBeGreaterThan(clearedBefore + 1);
        });

        test('hovering a source with no handlers at all is ignored', () => {
            const { map, fire } = makeMap();
            const proxy = new EventsProxy(map, { precisionMode: 'point' });
            const swl = makePlacesSource(map);
            const onHover = vi.fn();
            proxy.addEventHandler(swl, onHover, 'hover', { owner });
            // Drop the only handler: the layers stay queryable but the source is no longer registered.
            proxy.remove(swl, 'hover', owner);

            fire('mousemove', move);

            expect(onHover).not.toHaveBeenCalled();
        });

        test('box precision falls back to a padded bounds query when the point query misses', () => {
            const { map, fire, queryRenderedFeatures } = makeMap();
            const proxy = new EventsProxy(map, { precisionMode: 'point-then-box', paddingBoxPx: 4 });
            const swl = makePlacesSource(map);
            const onClick = vi.fn();
            proxy.addEventHandler(swl, onClick, 'click', { owner });
            // Nothing exactly under the pointer, but something within the padded box.
            queryRenderedFeatures.mockReturnValueOnce([]).mockReturnValueOnce(RAW);

            fire('click', move);

            expect(onClick).toHaveBeenCalledTimes(1);
            // Second query used the padded bounds built from paddingBoxPx.
            expect(queryRenderedFeatures.mock.calls[1][0]).toEqual([
                [move.point.x - 4, move.point.y + 4],
                [move.point.x + 4, move.point.y - 4],
            ]);
        });

        test('hover-move fires while the pointer travels along the hovered feature', () => {
            const { map, fire } = makeMap();
            const proxy = new EventsProxy(map, { precisionMode: 'point' });
            const swl = makePlacesSource(map);
            const onHoverMove = vi.fn();
            proxy.addEventHandler(swl, onHoverMove, 'hover-move', { owner });

            fire('mousemove', move);
            fire('mousemove', { point: { x: move.point.x + 6, y: move.point.y + 6 }, lngLat: move.lngLat });

            expect(onHoverMove).toHaveBeenCalled();
            const [topFeature, , allEventFeatures] = onHoverMove.mock.calls.at(-1) as [Feature, unknown, Feature[]];
            expect((topFeature.properties as { cachedOnly?: boolean }).cachedOnly).toBe(true);
            expect(allEventFeatures).toHaveLength(1);
        });

        test('a layer-scoped handler sees only its own layers in the features it is given', () => {
            const { map, fire, queryRenderedFeatures } = makeMap();
            const proxy = new EventsProxy(map, { precisionMode: 'point' });
            const swl = makePlacesSource(map);
            // Two hits from the same source, on different layers and with different ids, so the
            // scoped handler's array is provably narrower than the unscoped one's.
            const onLayer0 = { id: 'p1', source: PLACES, layer: { id: 'layer0' }, properties: { id: 'p1' } };
            const onLayer1 = { id: 'p2', source: PLACES, layer: { id: 'layer1' }, properties: { id: 'p2' } };
            queryRenderedFeatures.mockReturnValue([onLayer0, onLayer1]);

            const scopedHandler = vi.fn();
            const unscopedHandler = vi.fn();
            proxy.addEventHandler(swl, scopedHandler, 'click', {
                owner,
                scope: { layerFilter: (layer) => layer.id === 'layer0' },
            });
            proxy.addEventHandler(swl, unscopedHandler, 'click', { owner });

            fire('click', move);

            const [, , scopedFeatures] = scopedHandler.mock.calls[0] as [Feature, unknown, Feature[]];
            const [, , allFeatures] = unscopedHandler.mock.calls[0] as [Feature, unknown, Feature[]];
            expect(scopedFeatures.map((feature) => feature.id)).toEqual(['p1']);
            expect(allFeatures.map((feature) => feature.id)).toEqual(['p1', 'p2']);
        });
    });

    test('several moves within one frame cost a single rendered-features query', () => {
        // queryRenderedFeatures is the dominant cost per move, and the pointer can outrun the
        // compositor by several events per frame — only the newest position matters.
        const frames: FrameRequestCallback[] = [];
        vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
            frames.push(cb);
            return frames.length;
        });
        const { map, fire, queryRenderedFeatures } = makeMap();
        const proxy = new EventsProxy(map, { precisionMode: 'point' });
        const swl = makePlacesSource(map);
        const onHover = vi.fn();
        proxy.addEventHandler(swl, onHover, 'hover', { owner });

        fire('mousemove', { point: { x: 1, y: 1 }, lngLat: move.lngLat });
        fire('mousemove', { point: { x: 5, y: 5 }, lngLat: move.lngLat });
        fire('mousemove', move);

        // Three moves, one frame booked, nothing queried yet.
        expect(frames).toHaveLength(1);
        expect(queryRenderedFeatures).not.toHaveBeenCalled();

        frames[0](0);

        expect(queryRenderedFeatures).toHaveBeenCalledTimes(1);
        // The newest position won, not the first.
        expect(queryRenderedFeatures.mock.calls[0][0]).toEqual(move.point);
        expect(onHover).toHaveBeenCalledTimes(1);
    });

    test('disabling the proxy drops a move already queued for the next frame', () => {
        const frames: FrameRequestCallback[] = [];
        vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
            frames.push(cb);
            return frames.length;
        });
        const { map, fire, queryRenderedFeatures } = makeMap();
        const proxy = new EventsProxy(map, { precisionMode: 'point' });
        const swl = makePlacesSource(map);
        proxy.addEventHandler(swl, vi.fn(), 'hover', { owner });

        fire('mousemove', move);
        proxy.enable(false);
        frames[0](0);

        expect(queryRenderedFeatures).not.toHaveBeenCalled();
    });

    // A layer-group scope matches on the style's `metadata.group`, which a feature returned by
    // queryRenderedFeatures does not carry on its `layer`. Narrowing must therefore go through the
    // layer IDs the scope resolved to, not the scope's predicate.
    describe('layer-group scoped handlers with metadata-less rendered features', () => {
        const roadsGroup = (layer: { metadata?: { group?: string } }) => layer.metadata?.group === 'road';

        test('a scoped handler still receives its features when the rendered layer has no metadata', () => {
            const { map, fire, queryRenderedFeatures } = makeMap();
            const proxy = new EventsProxy(map, { precisionMode: 'point' });
            const swl = makePlacesSource(map);
            // Registration sees the style spec, complete with metadata...
            swl._layerSpecs[0].metadata = { group: 'road' };
            // ...while the rendered hit carries only the layer id, as MapLibre reports it.
            const renderedRoad = {
                id: 'r1',
                source: PLACES,
                layer: { id: 'layer0' },
                properties: { id: 'r1' },
            };
            queryRenderedFeatures.mockReturnValue([renderedRoad]);

            const onClick = vi.fn();
            proxy.addEventHandler(swl, onClick, 'click', { owner, scope: { layerFilter: roadsGroup as never } });

            fire('click', move);

            expect(onClick).toHaveBeenCalledTimes(1);
            const [topFeature, , allEventFeatures] = onClick.mock.calls[0] as [Feature, unknown, Feature[]];
            expect(topFeature).toBeDefined();
            expect(allEventFeatures).toHaveLength(1);
        });
    });
});
