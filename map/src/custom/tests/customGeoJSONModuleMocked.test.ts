import type { FeatureCollection, Point, Polygon } from 'geojson';
import type { Map } from 'maplibre-gl';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { TomTomMap } from '../../TomTomMap';
import { CustomGeoJSONModule } from '../CustomGeoJSONModule';

// NOTE: these tests are heavily mocked and mainly exist to keep coverage numbers high.
// Real behaviour is covered in map-integration-tests.

const buildMockedMap = () => {
    const addedLayers: Record<string, { layout?: Record<string, unknown> }> = {};
    const setDataMock = vi.fn();
    const sourceMock = { id: 'source-id', setData: setDataMock };
    const registeredImages: Record<string, unknown> = {};
    const addImageMock = vi.fn().mockImplementation((id: string, image: unknown) => {
        registeredImages[id] = image;
    });
    const hasImageMock = vi.fn().mockImplementation((id: string) => id in registeredImages);
    const tomtomMap = {
        mapLibreMap: {
            once: vi.fn().mockReturnValue(Promise.resolve()),
            getSource: vi.fn().mockReturnValue(sourceMock),
            getStyle: vi.fn().mockReturnValue({ layers: [], sources: {} }),
            getLayer: vi.fn().mockImplementation((id: string) => addedLayers[id]),
            addLayer: vi.fn().mockImplementation((spec: { id: string }) => {
                addedLayers[spec.id] = { layout: {} };
            }),
            removeLayer: vi.fn().mockImplementation((id: string) => {
                delete addedLayers[id];
            }),
            addSource: vi.fn(),
            isStyleLoaded: vi.fn().mockReturnValue(true),
            setLayoutProperty: vi.fn(),
            setPaintProperty: vi.fn(),
            setFilter: vi.fn(),
            setLayerZoomRange: vi.fn(),
            getMinZoom: vi.fn().mockReturnValue(0),
            getMaxZoom: vi.fn().mockReturnValue(22),
            moveLayer: vi.fn(),
            addImage: addImageMock,
            hasImage: hasImageMock,
        } as unknown as Map,
        _eventsProxy: {
            add: vi.fn(),
            ensureAdded: vi.fn(),
            updateIfRegistered: vi.fn(),
            addEventHandler: vi.fn(),
            removeHandler: vi.fn(),
            remove: vi.fn(),
        },
        addStyleChangeHandler: vi.fn(),
        mapReady: true,
    } as unknown as TomTomMap;
    return { tomtomMap, addImageMock, hasImageMock, registeredImages };
};

type TestSources = {
    points: FeatureCollection<Point>;
    polygons: FeatureCollection<Polygon>;
};

const buildConfig = () => ({
    sources: {
        points: {
            layers: [{ type: 'circle' as const, paint: { 'circle-radius': 4 } }],
        },
        polygons: {
            sourceID: 'custom-polygons',
            layers: [{ id: 'polygon-fill', type: 'fill' as const, paint: { 'fill-color': '#abc' } }],
        },
    },
});

const emptyPoints: FeatureCollection<Point> = { type: 'FeatureCollection', features: [] };
const emptyPolygons: FeatureCollection<Polygon> = { type: 'FeatureCollection', features: [] };

describe('CustomGeoJSONModule', () => {
    let tomtomMapMock: TomTomMap;
    let mapHarness: ReturnType<typeof buildMockedMap>;

    beforeEach(() => {
        mapHarness = buildMockedMap();
        tomtomMapMock = mapHarness.tomtomMap;
    });

    test('init creates one source per config entry with auto-generated and explicit IDs', async () => {
        const module = await CustomGeoJSONModule.get<TestSources>(tomtomMapMock, buildConfig());
        const ids = module.sourceAndLayerIDs;

        expect(ids.points.sourceID).toMatch(/^custom-geojson-\d+-points$/);
        expect(ids.points.layerIDs[0]).toMatch(/^custom-geojson-\d+-points-layer-0$/);
        expect(ids.polygons.sourceID).toBe('custom-polygons');
        expect(ids.polygons.layerIDs).toEqual(['polygon-fill']);
    });

    test('show/clear/getShown round-trip per source', async () => {
        const module = await CustomGeoJSONModule.get<TestSources>(tomtomMapMock, buildConfig());
        const pointsData: FeatureCollection<Point> = {
            type: 'FeatureCollection',
            features: [
                { type: 'Feature', id: 'a', geometry: { type: 'Point', coordinates: [0, 0] }, properties: { id: 'a' } },
            ],
        };

        await module.show(pointsData, 'points');
        expect(module.getShown().points).toBe(pointsData);
        expect(module.getShown().polygons).toEqual(emptyPolygons);

        await module.clear('points');
        expect(module.getShown().points).toEqual(emptyPoints);

        await module.show(pointsData, 'points');
        await module.clear();
        expect(module.getShown().points).toEqual(emptyPoints);
        expect(module.getShown().polygons).toEqual(emptyPolygons);
    });

    test('show without a source name applies data to every source', async () => {
        type SharedSources = {
            a: FeatureCollection<Point>;
            b: FeatureCollection<Point>;
        };
        const module = await CustomGeoJSONModule.get<SharedSources>(tomtomMapMock, {
            sources: {
                a: { layers: [{ type: 'circle' as const, paint: { 'circle-radius': 4 } }] },
                b: { layers: [{ type: 'circle' as const, paint: { 'circle-radius': 6 } }] },
            },
        });
        const data: FeatureCollection<Point> = {
            type: 'FeatureCollection',
            features: [
                { type: 'Feature', id: 'a', geometry: { type: 'Point', coordinates: [0, 0] }, properties: { id: 'a' } },
            ],
        };

        await module.show(data);

        expect(module.getShown().a.features).toHaveLength(1);
        expect(module.getShown().b.features).toHaveLength(1);

        await module.clear();
        expect(module.getShown().a).toEqual(emptyPoints);
        expect(module.getShown().b).toEqual(emptyPoints);
    });

    test('show normalizes feature.id and properties.id when missing', async () => {
        const module = await CustomGeoJSONModule.get<TestSources>(tomtomMapMock, buildConfig());
        const pointsData: FeatureCollection<Point> = {
            type: 'FeatureCollection',
            features: [
                { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} },
                { type: 'Feature', geometry: { type: 'Point', coordinates: [1, 1] }, properties: { name: 'B' } },
            ],
        };

        await module.show(pointsData, 'points');

        const shown = module.getShown().points;
        expect(shown.features[0].id).toBe(0);
        expect(shown.features[0].properties).toEqual({ id: 0 });
        expect(shown.features[1].id).toBe(1);
        expect(shown.features[1].properties).toEqual({ name: 'B', id: 1 });
    });

    test('show preserves explicit feature.id and aligns properties.id', async () => {
        const module = await CustomGeoJSONModule.get<TestSources>(tomtomMapMock, buildConfig());
        const pointsData: FeatureCollection<Point> = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    id: 'custom',
                    geometry: { type: 'Point', coordinates: [0, 0] },
                    properties: { value: 7 },
                },
            ],
        };

        await module.show(pointsData, 'points');

        const [feature] = module.getShown().points.features;
        expect(feature.id).toBe('custom');
        expect(feature.properties).toEqual({ value: 7, id: 'custom' });
    });

    test('throws on empty sources or empty layers', async () => {
        await expect(CustomGeoJSONModule.get(tomtomMapMock, { sources: {} } as never)).rejects.toThrow(
            /at least one source/,
        );
        await expect(
            CustomGeoJSONModule.get(tomtomMapMock, {
                sources: { foo: { layers: [] } },
            } as never),
        ).rejects.toThrow(/at least one layer/);
    });

    test('events getter returns a CombinedEvents per source', async () => {
        const module = await CustomGeoJSONModule.get<TestSources>(tomtomMapMock, buildConfig());
        expect(module.events.points).toBeDefined();
        expect(module.events.polygons).toBeDefined();
        expect(typeof module.events.points.on).toBe('function');
    });

    test('shown-features handlers fire per source and config-change is module-wide', async () => {
        const module = await CustomGeoJSONModule.get<TestSources>(tomtomMapMock, buildConfig());
        const onShownPoints = vi.fn();
        const onShownPolygons = vi.fn();
        const onConfigChange = vi.fn();

        module.events.points.on('shown-features', onShownPoints);
        module.events.polygons.on('shown-features', onShownPolygons);
        module.events.points.on('config-change', onConfigChange);

        const pointsData: FeatureCollection<Point> = {
            type: 'FeatureCollection',
            features: [
                { type: 'Feature', id: 'a', geometry: { type: 'Point', coordinates: [0, 0] }, properties: { id: 'a' } },
            ],
        };

        await module.show(pointsData, 'points');
        expect(onShownPoints).toHaveBeenCalledWith(pointsData);
        expect(onShownPolygons).not.toHaveBeenCalled();

        module.setVisible(false);
        expect(onConfigChange).toHaveBeenCalledTimes(1);
    });

    test('restoreDataAndConfigImpl keeps source and layer IDs stable across a style change', async () => {
        const module = await CustomGeoJSONModule.get<TestSources>(tomtomMapMock, buildConfig());
        const before = structuredClone(module.sourceAndLayerIDs);

        (module as unknown as { restoreDataAndConfigImpl(): void }).restoreDataAndConfigImpl();

        expect(module.sourceAndLayerIDs).toEqual(before);
    });

    test('config.images are registered with map.addImage on init', async () => {
        const fakeImage = { width: 1, height: 1, data: new Uint8ClampedArray([0, 0, 0, 0]) };
        await CustomGeoJSONModule.get<TestSources>(tomtomMapMock, {
            ...buildConfig(),
            images: { 'my-marker': { image: fakeImage, options: { pixelRatio: 2 } } },
        });

        expect(mapHarness.addImageMock).toHaveBeenCalledWith('my-marker', fakeImage, { pixelRatio: 2 });
    });

    test('images are re-registered on restore after a style change clears them', async () => {
        const fakeImage = { width: 1, height: 1, data: new Uint8ClampedArray([0, 0, 0, 0]) };
        const module = await CustomGeoJSONModule.get<TestSources>(tomtomMapMock, {
            ...buildConfig(),
            images: { 'my-marker': { image: fakeImage } },
        });

        // Simulate MapLibre dropping images on style change.
        delete mapHarness.registeredImages['my-marker'];
        mapHarness.addImageMock.mockClear();

        (module as unknown as { restoreDataAndConfigImpl(): void }).restoreDataAndConfigImpl();
        expect(mapHarness.addImageMock).toHaveBeenCalledWith('my-marker', fakeImage, undefined);
    });

    test('applyConfig registers newly added images', async () => {
        const initialImage = { width: 1, height: 1, data: new Uint8ClampedArray([0, 0, 0, 0]) };
        const newImage = { width: 1, height: 1, data: new Uint8ClampedArray([255, 0, 0, 255]) };
        const module = await CustomGeoJSONModule.get<TestSources>(tomtomMapMock, {
            ...buildConfig(),
            images: { initial: { image: initialImage } },
        });
        mapHarness.addImageMock.mockClear();

        module.applyConfig({
            ...buildConfig(),
            images: {
                initial: { image: initialImage },
                added: { image: newImage, options: { pixelRatio: 2 } },
            },
        });

        expect(mapHarness.addImageMock).toHaveBeenCalledWith('added', newImage, { pixelRatio: 2 });
        expect(mapHarness.addImageMock).not.toHaveBeenCalledWith('initial', expect.anything(), expect.anything());
    });

    test('images already present on the map are not re-added', async () => {
        const fakeImage = { width: 1, height: 1, data: new Uint8ClampedArray([0, 0, 0, 0]) };
        // Pre-seed an image to simulate a previously registered one.
        mapHarness.registeredImages['existing-icon'] = fakeImage;

        await CustomGeoJSONModule.get<TestSources>(tomtomMapMock, {
            ...buildConfig(),
            images: { 'existing-icon': { image: fakeImage } },
        });

        expect(mapHarness.addImageMock).not.toHaveBeenCalledWith('existing-icon', expect.anything(), expect.anything());
    });
});
