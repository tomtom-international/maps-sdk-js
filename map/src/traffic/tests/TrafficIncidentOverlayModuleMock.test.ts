import type { TrafficIncidentDetails } from '@tomtom-org/maps-sdk/core';
import type { Map } from 'maplibre-gl';
import { describe, expect, test, vi } from 'vitest';
import type { TomTomMap } from '../../TomTomMap';
import { TrafficIncidentOverlayModule } from '../TrafficIncidentOverlayModule';
import type { TrafficIncidentOverlayConfig } from '../types/trafficIncidentOverlayConfig';

// NOTE: heavily mocked — real rendering is covered in map-integration-tests.
const makeMockMap = () => {
    const source = { setData: vi.fn() };
    // Stateful layer registry: getLayer must return truthy once addLayer has been called for that id,
    // so SourceWithLayers.setLayersVisible's existence-guard does not skip the setLayoutProperty call.
    const addedLayers = new Set<string>();
    const mapLibreMap = {
        // First call returns undefined so the source is "added"; subsequent calls return the runtime source.
        getSource: vi.fn().mockReturnValueOnce(undefined).mockReturnValue(source),
        addSource: vi.fn(),
        getLayer: vi.fn().mockImplementation((id: string) => (addedLayers.has(id) ? { id } : undefined)),
        addLayer: vi.fn().mockImplementation((spec: { id: string }) => {
            addedLayers.add(spec.id);
        }),
        removeLayer: vi.fn().mockImplementation((id: string) => {
            addedLayers.delete(id);
        }),
        setLayoutProperty: vi.fn(),
        getLayoutProperty: vi.fn().mockReturnValue('visible'),
        getStyle: vi.fn().mockReturnValue({ layers: [], sources: {} }),
        isStyleLoaded: vi.fn().mockReturnValue(true),
        once: vi.fn().mockReturnValue(Promise.resolve()),
        queryRenderedFeatures: vi.fn().mockReturnValue([]),
        moveLayer: vi.fn(),
        hasImage: vi.fn().mockReturnValue(false),
        addImage: vi.fn(),
        setFeatureState: vi.fn(),
        removeFeatureState: vi.fn(),
    } as unknown as Map;
    return {
        mapLibreMap,
        _eventsProxy: { add: vi.fn(), ensureAdded: vi.fn(), updateIfRegistered: vi.fn() },
        addStyleChangeHandler: vi.fn(),
        mapReady: true,
    } as unknown as TomTomMap;
};

const emptyResult: TrafficIncidentDetails = { type: 'FeatureCollection', features: [] };

const TOTAL_LAYERS = 8; // 5 line (focus-halo + outline + inner-solid + inner-chevron + inner-pattern) + 3 symbol

describe('TrafficIncidentOverlayModule', () => {
    test('get() resolves an instance and initialises source+layers', async () => {
        const tomtomMap = makeMockMap();
        const mod = await TrafficIncidentOverlayModule.get(tomtomMap);

        expect(mod).toBeDefined();
        expect(tomtomMap.mapLibreMap.addSource).toHaveBeenCalled();
        expect(tomtomMap.mapLibreMap.addLayer).toHaveBeenCalledTimes(TOTAL_LAYERS);
    });

    test('adds five line layers in paint order: focus-halo (bottom), outline, inner-solid, inner-chevron, inner-pattern', async () => {
        const tomtomMap = makeMockMap();
        await TrafficIncidentOverlayModule.get(tomtomMap);

        const addLayer = tomtomMap.mapLibreMap.addLayer as ReturnType<typeof vi.fn>;
        const lineLayers = addLayer.mock.calls.map((c) => c[0]).filter((l) => l.type === 'line');
        const suffixes = lineLayers.map((l) => l.id.replace(/^traffic-incident-overlay-\d+-/, ''));
        expect(suffixes).toEqual(['focus-halo', 'outline', 'inner-solid', 'inner-chevron', 'inner-pattern']);
    });

    test('focus-halo layer is invisible for non-focused features and renders a crisp black outline on focused ones', async () => {
        const tomtomMap = makeMockMap();
        await TrafficIncidentOverlayModule.get(tomtomMap);

        const addLayer = tomtomMap.mapLibreMap.addLayer as ReturnType<typeof vi.fn>;
        const halo = addLayer.mock.calls.map((c) => c[0]).find((l) => l.id.endsWith('-focus-halo'));
        expect(halo?.type).toBe('line');
        // Opacity is 0 unless feature-state.focused === true.
        const serialisedOpacity = JSON.stringify(halo?.paint?.['line-opacity']);
        expect(serialisedOpacity).toContain('feature-state');
        expect(serialisedOpacity).toContain('focused');
        // No blur — the halo is a crisp black outline, not a soft glow.
        expect(halo?.paint?.['line-blur']).toBe(0);
        expect(halo?.paint?.['line-color']).toBe('#000');
    });

    test('inner-chevron layer paints the direction chevron on jam magnitudes only, from z12', async () => {
        const tomtomMap = makeMockMap();
        await TrafficIncidentOverlayModule.get(tomtomMap);

        const addLayer = tomtomMap.mapLibreMap.addLayer as ReturnType<typeof vi.fn>;
        const chevron = addLayer.mock.calls.map((c) => c[0]).find((l) => l.id.endsWith('-inner-chevron'));
        expect(chevron?.type).toBe('line');
        expect(chevron?.minzoom).toBe(12);
        expect(chevron?.paint?.['line-pattern']).toBe('tt-traffic-incident-direction-chevron');
        // Only jams carry direction; closures (indefinite) and informational stripes (unknown) don't.
        expect(chevron?.filter).toEqual([
            'in',
            ['get', 'magnitudeOfDelay'],
            ['literal', ['minor', 'moderate', 'major']],
        ]);
    });

    test('inner-pattern layer uses canonical line-pattern sprites per magnitude', async () => {
        const tomtomMap = makeMockMap();
        await TrafficIncidentOverlayModule.get(tomtomMap);

        const addLayer = tomtomMap.mapLibreMap.addLayer as ReturnType<typeof vi.fn>;
        const patternLayer = addLayer.mock.calls.map((c) => c[0]).find((l) => l.id.endsWith('-inner-pattern'));
        const serialised = JSON.stringify(patternLayer?.paint?.['line-pattern']);
        expect(serialised).toContain('traffic-incidents-no_delay-pattern');
        expect(serialised).toContain('traffic-incidents-road_closed-pattern');
    });

    test('line-width is a plain zoom interpolation (no road-class references)', async () => {
        const tomtomMap = makeMockMap();
        await TrafficIncidentOverlayModule.get(tomtomMap);

        const addLayer = tomtomMap.mapLibreMap.addLayer as ReturnType<typeof vi.fn>;
        const lineLayers = addLayer.mock.calls.map((c) => c[0]).filter((l) => l.type === 'line');
        for (const layer of lineLayers) {
            const serialised = JSON.stringify(layer.paint ?? {});
            // We deliberately drop road_category/road_subcategory-driven widths because
            // the REST API doesn't emit them; applying them would just approximate.
            expect(serialised).not.toContain('road_category');
            expect(serialised).not.toContain('road_subcategory');
            // No line-offset either — see module JSDoc "API limitations".
            expect(layer.paint?.['line-offset']).toBeUndefined();
        }
    });

    test('adds three symbol marker layers at correct minzooms', async () => {
        const tomtomMap = makeMockMap();
        await TrafficIncidentOverlayModule.get(tomtomMap);

        const addLayer = tomtomMap.mapLibreMap.addLayer as ReturnType<typeof vi.fn>;
        const symbolLayers = addLayer.mock.calls.map((c) => c[0]).filter((l) => l.type === 'symbol');
        expect(symbolLayers).toHaveLength(3);

        const byId = Object.fromEntries(
            symbolLayers.map((l) => [l.id.replace(/^traffic-incident-overlay-\d+-/, ''), l]),
        );
        expect(byId['incident-marker'].minzoom).toBe(13);
        expect(byId['jam-marker'].minzoom).toBe(12);
        expect(byId['closed-road-marker'].minzoom).toBe(12);

        // No symbol marker restricts by geometry-type; MapLibre's `symbol-placement: 'point'`
        // renders LineString features at their first vertex, and 'line' is a no-op on Points.
        for (const layer of symbolLayers) {
            expect(JSON.stringify(layer.filter ?? [])).not.toContain('geometry-type');
        }
    });

    test('incident marker filter excludes indefinite (road-closed) magnitude', async () => {
        const tomtomMap = makeMockMap();
        await TrafficIncidentOverlayModule.get(tomtomMap);

        const addLayer = tomtomMap.mapLibreMap.addLayer as ReturnType<typeof vi.fn>;
        const incidentMarker = addLayer.mock.calls.map((c) => c[0]).find((l) => l.id.endsWith('-incident-marker'));
        expect(incidentMarker?.filter).toEqual(
            expect.arrayContaining([['!=', ['get', 'magnitudeOfDelay'], 'indefinite']]),
        );
    });

    test('jam marker selects category=jam, renders icon + delay text', async () => {
        const tomtomMap = makeMockMap();
        await TrafficIncidentOverlayModule.get(tomtomMap);

        const addLayer = tomtomMap.mapLibreMap.addLayer as ReturnType<typeof vi.fn>;
        const jamMarker = addLayer.mock.calls.map((c) => c[0]).find((l) => l.id.endsWith('-jam-marker'));
        expect(jamMarker?.filter).toEqual(
            expect.arrayContaining([
                ['==', ['get', 'category'], 'jam'],
                ['!=', ['get', 'magnitudeOfDelay'], 'unknown'],
                ['!=', ['get', 'magnitudeOfDelay'], 'indefinite'],
            ]),
        );
        // Single merged layer — icon and delay text on one symbol layer.
        expect(jamMarker?.layout?.['icon-image']).toBeDefined();
        expect(jamMarker?.layout?.['text-field']).toBeDefined();
        expect(jamMarker?.layout?.['icon-anchor']).toBe('bottom-left');
    });

    test('closed-road marker filters on indefinite magnitude and uses the road_closed sprite', async () => {
        const tomtomMap = makeMockMap();
        await TrafficIncidentOverlayModule.get(tomtomMap);

        const addLayer = tomtomMap.mapLibreMap.addLayer as ReturnType<typeof vi.fn>;
        const closedMarker = addLayer.mock.calls.map((c) => c[0]).find((l) => l.id.endsWith('-closed-road-marker'));
        expect(closedMarker?.filter).toEqual(['==', ['get', 'magnitudeOfDelay'], 'indefinite']);
        expect(closedMarker?.layout?.['icon-image']).toBe('traffic-incidents-road_closed');
    });

    test('symbol layers do not force allow-overlap or ignore-placement (canonical relies on collision culling)', async () => {
        const tomtomMap = makeMockMap();
        await TrafficIncidentOverlayModule.get(tomtomMap);

        const addLayer = tomtomMap.mapLibreMap.addLayer as ReturnType<typeof vi.fn>;
        const symbolLayers = addLayer.mock.calls.map((c) => c[0]).filter((l) => l.type === 'symbol');
        for (const layer of symbolLayers) {
            expect(layer.layout?.['icon-allow-overlap']).not.toBe(true);
            expect(layer.layout?.['icon-ignore-placement']).not.toBe(true);
        }
    });

    test('show() and clear() update the source data', async () => {
        const tomtomMap = makeMockMap();
        const mod = await TrafficIncidentOverlayModule.get(tomtomMap);

        await mod.show(emptyResult);
        await mod.clear();

        // source.setData called at least twice (show + clear). The first getSource call
        // (during source init) returns undefined; the second returns the runtime source.
        const getSourceResults = (tomtomMap.mapLibreMap.getSource as ReturnType<typeof vi.fn>).mock.results;
        const source = getSourceResults.find((r) => r.value !== undefined)?.value;
        expect(source?.setData).toHaveBeenCalled();
    });

    test('setVisible toggles layer visibility; show() does not flip it', async () => {
        const tomtomMap = makeMockMap();
        const mod = await TrafficIncidentOverlayModule.get(tomtomMap, { visible: false });
        const setLayoutProperty = tomtomMap.mapLibreMap.setLayoutProperty as ReturnType<typeof vi.fn>;

        // visible:false at init must have hidden the layers.
        expect(setLayoutProperty.mock.calls.some((c) => c[1] === 'visibility' && c[2] === 'none')).toBe(true);

        // Now the key invariant: show() alone must NOT flip visibility.
        setLayoutProperty.mockClear();
        await mod.show(emptyResult);
        expect(setLayoutProperty.mock.calls.every((c) => c[2] !== 'visible')).toBe(true);

        // setVisible(true) flips both layers to 'visible'.
        setLayoutProperty.mockClear();
        mod.setVisible(true);
        expect(setLayoutProperty).toHaveBeenCalledWith(expect.any(String), 'visibility', 'visible', expect.anything());
    });

    test('getShown() returns the cached shownFeatures without hit-testing the viewport', async () => {
        const tomtomMap = makeMockMap();
        const queryRenderedFeatures = tomtomMap.mapLibreMap.queryRenderedFeatures as ReturnType<typeof vi.fn>;
        const result: TrafficIncidentDetails = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: { id: 'a', category: 'accident' },
                    geometry: { type: 'Point', coordinates: [0, 0] },
                } as unknown as TrafficIncidentDetails['features'][number],
            ],
        };

        const mod = await TrafficIncidentOverlayModule.get(tomtomMap);
        await mod.show(result);
        queryRenderedFeatures.mockClear();
        const shown = mod.getShown();

        // Reads the GeoJSON cache (the exact data passed to show()), like the other GeoJSON modules.
        expect(shown.incidents).toBe(result);
        expect(queryRenderedFeatures).not.toHaveBeenCalled();
    });

    test('defaults all layers to sit below `lowestLabel` so labels stay readable', async () => {
        const tomtomMap = makeMockMap();
        await TrafficIncidentOverlayModule.get(tomtomMap);

        const addLayer = tomtomMap.mapLibreMap.addLayer as ReturnType<typeof vi.fn>;
        expect(addLayer).toHaveBeenCalledTimes(TOTAL_LAYERS);
        // SourceWithLayers calls `addLayer(spec, spec.beforeID)` — assert the MapLibre
        // second-arg anchor matches `mapStyleLayerIDs.lowestLabel = 'Borders - Treaty label'`.
        for (const call of addLayer.mock.calls) {
            expect(call[0].beforeID).toBe('Borders - Treaty label');
            expect(call[1]).toBe('Borders - Treaty label');
        }
    });

    test('beforeLayerConfig: "top" suppresses the anchor so layers render above everything', async () => {
        const tomtomMap = makeMockMap();
        await TrafficIncidentOverlayModule.get(tomtomMap, { beforeLayerConfig: 'top' });

        const addLayer = tomtomMap.mapLibreMap.addLayer as ReturnType<typeof vi.fn>;
        for (const call of addLayer.mock.calls) {
            expect(call[0].beforeID).toBeUndefined();
        }
    });

    test('moveBeforeLayer moves all layers before the target', async () => {
        const tomtomMap = makeMockMap();
        const mod = await TrafficIncidentOverlayModule.get(tomtomMap);
        const moveLayer = tomtomMap.mapLibreMap.moveLayer as ReturnType<typeof vi.fn>;
        moveLayer.mockClear();

        mod.moveBeforeLayer('lowestLabel');

        expect(moveLayer).toHaveBeenCalledTimes(TOTAL_LAYERS);
    });

    test('moveBeforeLayer with "top" passes undefined to MapLibre', async () => {
        const tomtomMap = makeMockMap();
        const mod = await TrafficIncidentOverlayModule.get(tomtomMap);
        const moveLayer = tomtomMap.mapLibreMap.moveLayer as ReturnType<typeof vi.fn>;
        moveLayer.mockClear();

        mod.moveBeforeLayer('top');

        expect(moveLayer).toHaveBeenCalledWith(expect.any(String), undefined);
    });

    test('_applyConfig honors beforeLayerConfig at init', async () => {
        const tomtomMap = makeMockMap();
        const moveLayer = tomtomMap.mapLibreMap.moveLayer as ReturnType<typeof vi.fn>;

        await TrafficIncidentOverlayModule.get(tomtomMap, { beforeLayerConfig: 'lowestLabel' });

        expect(moveLayer).toHaveBeenCalledTimes(TOTAL_LAYERS);
    });

    test('shown-features handler fires with the service result', async () => {
        const tomtomMap = makeMockMap();
        const mod = await TrafficIncidentOverlayModule.get(tomtomMap);

        const seen: TrafficIncidentDetails[] = [];
        mod.events.on('shown-features', (r) => seen.push(r));

        const result: TrafficIncidentDetails = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    id: 'x',
                    properties: {
                        id: 'x',
                        category: 'accident',
                        magnitudeOfDelay: 'major',
                        events: [],
                        timeValidity: 'present',
                    },
                    geometry: { type: 'Point', coordinates: [0, 0] },
                },
            ],
        };
        await mod.show(result);

        expect(seen).toHaveLength(1);
        expect(seen[0]).toBe(result);
    });

    test('config-change handler fires when setVisible is called', async () => {
        const tomtomMap = makeMockMap();
        const mod = await TrafficIncidentOverlayModule.get(tomtomMap);

        const seen: Array<TrafficIncidentOverlayConfig | undefined> = [];
        mod.events.on('config-change', (c) => seen.push(c));

        mod.setVisible(false);

        expect(seen.some((c) => c?.visible === false)).toBe(true);
    });

    test('restore replays last show() after style change', async () => {
        const tomtomMap = makeMockMap();
        const mod = await TrafficIncidentOverlayModule.get(tomtomMap);

        const result: TrafficIncidentDetails = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    id: 'z',
                    properties: {
                        id: 'z',
                        category: 'jam',
                        magnitudeOfDelay: 'minor',
                        events: [],
                        timeValidity: 'present',
                    },
                    geometry: { type: 'Point', coordinates: [1, 1] },
                },
            ],
        };
        await mod.show(result);

        // Capture the most recent setData calls before restore.
        const getSource = tomtomMap.mapLibreMap.getSource as ReturnType<typeof vi.fn>;
        const sourceObj = getSource.mock.results.find((r) => r.value !== undefined)?.value;
        const setData = sourceObj?.setData as ReturnType<typeof vi.fn>;
        setData?.mockClear();

        // Simulate restore by invoking the protected hook through a cast.
        (mod as unknown as { restoreDataAndConfigImpl: () => void }).restoreDataAndConfigImpl();

        // The override must re-play the cached data by calling setData with the FeatureCollection.
        expect(setData).toHaveBeenCalledWith(result);
    });

    test('restore keeps source and layer IDs stable', async () => {
        const tomtomMap = makeMockMap();
        const mod = await TrafficIncidentOverlayModule.get(tomtomMap);
        const before = { ...mod.sourceAndLayerIDs.incidents };

        (mod as unknown as { restoreDataAndConfigImpl: () => void }).restoreDataAndConfigImpl();
        const after = mod.sourceAndLayerIDs.incidents;

        expect(after.sourceID).toBe(before.sourceID);
        expect(after.layerIDs).toEqual(before.layerIDs);
    });

    describe('setFocus', () => {
        const fixture: TrafficIncidentDetails = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    id: 'a',
                    properties: {
                        id: 'a',
                        category: 'jam',
                        magnitudeOfDelay: 'major',
                        events: [],
                        timeValidity: 'present',
                    } as any,
                    geometry: { type: 'Point', coordinates: [0, 0] },
                },
                {
                    type: 'Feature',
                    id: 'b',
                    properties: {
                        id: 'b',
                        category: 'jam',
                        magnitudeOfDelay: 'minor',
                        events: [],
                        timeValidity: 'present',
                    } as any,
                    geometry: { type: 'Point', coordinates: [0, 0] },
                },
                {
                    type: 'Feature',
                    id: 'c',
                    properties: {
                        id: 'c',
                        category: 'jam',
                        magnitudeOfDelay: 'minor',
                        events: [],
                        timeValidity: 'present',
                    } as any,
                    geometry: { type: 'Point', coordinates: [0, 0] },
                },
            ],
        };

        test('setFocus(ids) writes focused=true for the set and focused=false for the rest', async () => {
            const tomtomMap = makeMockMap();
            const mod = await TrafficIncidentOverlayModule.get(tomtomMap);
            await mod.show(fixture);

            mod.setFocus(['a']);

            const setFS = tomtomMap.mapLibreMap.setFeatureState as ReturnType<typeof vi.fn>;
            const calls = setFS.mock.calls;
            const byId = Object.fromEntries(calls.map((c) => [c[0].id as string, c[1]]));
            expect(byId.a).toEqual({ focused: true });
            expect(byId.b).toEqual({ focused: false });
            expect(byId.c).toEqual({ focused: false });
        });

        test('setFocus(null) removes feature-state for every rendered feature', async () => {
            const tomtomMap = makeMockMap();
            const mod = await TrafficIncidentOverlayModule.get(tomtomMap);
            await mod.show(fixture);
            mod.setFocus(['a']);

            const removeFS = tomtomMap.mapLibreMap.removeFeatureState as ReturnType<typeof vi.fn>;
            removeFS.mockClear();

            mod.setFocus(null);

            const cleared = removeFS.mock.calls.map((c) => c[0].id).sort();
            expect(cleared).toEqual(['a', 'b', 'c']);
        });

        test('setFocus before show() is a no-op (nothing to write state on)', async () => {
            const tomtomMap = makeMockMap();
            const mod = await TrafficIncidentOverlayModule.get(tomtomMap);

            mod.setFocus(['a']);

            expect(tomtomMap.mapLibreMap.setFeatureState).not.toHaveBeenCalled();
        });

        test('show() with new data clears prior feature-state before applying', async () => {
            const tomtomMap = makeMockMap();
            const mod = await TrafficIncidentOverlayModule.get(tomtomMap);
            await mod.show(fixture);
            mod.setFocus(['a']);

            const removeFS = tomtomMap.mapLibreMap.removeFeatureState as ReturnType<typeof vi.fn>;
            removeFS.mockClear();

            await mod.show({ type: 'FeatureCollection', features: [] });

            expect(removeFS).toHaveBeenCalled();
        });

        test('restoreDataAndConfigImpl re-applies focus after a style reload', async () => {
            const tomtomMap = makeMockMap();
            const mod = await TrafficIncidentOverlayModule.get(tomtomMap);
            await mod.show(fixture);
            mod.setFocus(['a']);

            // Simulate MapLibre clearing feature-state on style reload by resetting spies, then
            // invoking the documented restore entry point.
            const setFS = tomtomMap.mapLibreMap.setFeatureState as ReturnType<typeof vi.fn>;
            setFS.mockClear();

            // Cast to access the protected method for test purposes.
            (mod as unknown as { restoreDataAndConfigImpl(): void }).restoreDataAndConfigImpl();

            // After restore, focus must be re-applied.
            const byId = Object.fromEntries(setFS.mock.calls.map((c) => [c[0].id as string, c[1]]));
            expect(byId.a).toEqual({ focused: true });
            expect(byId.b).toEqual({ focused: false });
        });

        test('show() with new data resets the focus cache so a later style reload does not re-apply stale focus', async () => {
            const tomtomMap = makeMockMap();
            const mod = await TrafficIncidentOverlayModule.get(tomtomMap);
            await mod.show(fixture);
            mod.setFocus(['a']);

            // New data arrives → focus should be dropped from the cache.
            await mod.show({ type: 'FeatureCollection', features: [] });

            const setFS = tomtomMap.mapLibreMap.setFeatureState as ReturnType<typeof vi.fn>;
            setFS.mockClear();
            // Simulate a style reload.
            (mod as unknown as { restoreDataAndConfigImpl(): void }).restoreDataAndConfigImpl();

            // Focus was cleared on the prior show() — restore should NOT re-apply it.
            expect(setFS).not.toHaveBeenCalled();
        });

        test('clear() removes feature-state and resets the tracked set', async () => {
            const tomtomMap = makeMockMap();
            const mod = await TrafficIncidentOverlayModule.get(tomtomMap);
            await mod.show(fixture);
            mod.setFocus(['a']);

            const removeFS = tomtomMap.mapLibreMap.removeFeatureState as ReturnType<typeof vi.fn>;
            removeFS.mockClear();

            await mod.clear();

            const cleared = removeFS.mock.calls.map((c) => c[0].id).sort();
            expect(cleared).toEqual(['a', 'b', 'c']);
        });

        test('non-halo line layers do not encode feature-state on opacity or colour (unfocused features render unchanged)', async () => {
            const tomtomMap = makeMockMap();
            await TrafficIncidentOverlayModule.get(tomtomMap);

            const addLayer = tomtomMap.mapLibreMap.addLayer as ReturnType<typeof vi.fn>;
            const nonHaloLines = addLayer.mock.calls
                .map((c) => c[0])
                .filter((l) => l.type === 'line' && !l.id.endsWith('-focus-halo'));

            for (const layer of nonHaloLines) {
                // No line-opacity expression at all — the property is absent so MapLibre's default (1) applies.
                expect(layer.paint?.['line-opacity']).toBeUndefined();
                // Colour is a plain magnitudeOfDelay match, never branched on feature-state.
                const colorSerialised = JSON.stringify(layer.paint?.['line-color'] ?? {});
                if (colorSerialised !== '{}') {
                    expect(colorSerialised).not.toContain('feature-state');
                }
            }
        });

        test('symbol layers do not encode feature-state on opacity (unfocused markers render unchanged)', async () => {
            const tomtomMap = makeMockMap();
            await TrafficIncidentOverlayModule.get(tomtomMap);

            const addLayer = tomtomMap.mapLibreMap.addLayer as ReturnType<typeof vi.fn>;
            const symbolLayers = addLayer.mock.calls.map((c) => c[0]).filter((l) => l.type === 'symbol');

            for (const layer of symbolLayers) {
                expect(layer.paint?.['icon-opacity']).toBeUndefined();
                expect(layer.paint?.['text-opacity']).toBeUndefined();
            }
        });

        test('line layers widen focused features via feature-state', async () => {
            const tomtomMap = makeMockMap();
            await TrafficIncidentOverlayModule.get(tomtomMap);

            const addLayer = tomtomMap.mapLibreMap.addLayer as ReturnType<typeof vi.fn>;
            const outline = addLayer.mock.calls.map((c) => c[0]).find((l) => l.id.endsWith('-outline'));
            expect(JSON.stringify(outline?.paint?.['line-width'])).toContain('feature-state');
        });
    });

    describe('focus config', () => {
        test('focus: false drops the halo layer and removes feature-state from line widths', async () => {
            const tomtomMap = makeMockMap();
            await TrafficIncidentOverlayModule.get(tomtomMap, { focus: false });

            const addLayer = tomtomMap.mapLibreMap.addLayer as ReturnType<typeof vi.fn>;
            const ids = addLayer.mock.calls.map((c) => c[0].id);
            expect(ids.some((id) => id.endsWith('-focus-halo'))).toBe(false);

            // 4 line layers + 3 symbol layers = 7 total when the halo is dropped.
            expect(addLayer).toHaveBeenCalledTimes(7);

            const lineLayers = addLayer.mock.calls.map((c) => c[0]).filter((l) => l.type === 'line');
            for (const layer of lineLayers) {
                expect(JSON.stringify(layer.paint?.['line-width'])).not.toContain('feature-state');
            }
        });

        test('focus: false still lets setFocus write feature-state for caller-managed visuals', async () => {
            const tomtomMap = makeMockMap();
            const setFS = tomtomMap.mapLibreMap.setFeatureState as ReturnType<typeof vi.fn>;
            const mod = await TrafficIncidentOverlayModule.get(tomtomMap, { focus: false });

            await mod.show({
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        id: 'a',
                        geometry: { type: 'Point', coordinates: [0, 0] },
                        properties: {
                            id: 'a',
                            category: 'accident',
                            magnitudeOfDelay: 'major',
                            events: [],
                            timeValidity: 'present',
                        },
                    },
                ],
            });
            mod.setFocus(['a']);
            const focusedCalls = setFS.mock.calls.filter((c) => c[1]?.focused === true);
            expect(focusedCalls.length).toBeGreaterThan(0);
        });

        test('focus.outlineColor overrides the halo line-color', async () => {
            const tomtomMap = makeMockMap();
            await TrafficIncidentOverlayModule.get(tomtomMap, { focus: { outlineColor: '#ff00aa' } });

            const addLayer = tomtomMap.mapLibreMap.addLayer as ReturnType<typeof vi.fn>;
            const halo = addLayer.mock.calls.map((c) => c[0]).find((l) => l.id.endsWith('-focus-halo'));
            expect(halo?.paint?.['line-color']).toBe('#ff00aa');
        });

        test('focus.widthScale: 1 keeps the focus-halo layer but stops the focused stripe from widening', async () => {
            const tomtomMap = makeMockMap();
            await TrafficIncidentOverlayModule.get(tomtomMap, { focus: { widthScale: 1 } });

            const addLayer = tomtomMap.mapLibreMap.addLayer as ReturnType<typeof vi.fn>;
            const ids = addLayer.mock.calls.map((c) => c[0].id);
            expect(ids.some((id) => id.endsWith('-focus-halo'))).toBe(true);

            const outline = addLayer.mock.calls.map((c) => c[0]).find((l) => l.id.endsWith('-outline'));
            // Width still carries the feature-state case, but the focused branch equals the unfocused one.
            const widthSerialised = JSON.stringify(outline?.paint?.['line-width']);
            expect(widthSerialised).toContain('feature-state');
            // Multiplier of 1 means the focused branch and unfocused branch hold the same number.
            // We assert no value larger than 1× any base appears anywhere in the expression by
            // checking there's no ratio difference between matched branches.
            const stops = outline?.paint?.['line-width'] as unknown as unknown[];
            // Every stop output (every odd index from index 3 onwards) is a 4-tuple ['case', cond, focused, base].
            for (let i = 4; i < stops.length; i += 2) {
                const branch = stops[i] as [string, unknown, number, number];
                expect(branch[2]).toBe(branch[3]);
            }
        });
    });
});
