import type { Map, MapGeoJSONFeature, ResourceType } from 'maplibre-gl';
import { describe, expect, test, vi } from 'vitest';
import type { StyleInput, StyleModule } from '../../init';
import poiLayerSpec from '../../places/layers/tests/poiLayerSpec.data';
import type { TomTomMap } from '../../TomTomMap';
import { HILLSHADE_SOURCE_ID } from '../layers/sourcesIDs';
import {
    addLayers,
    addOrUpdateImage,
    changeLayerProps,
    deserializeFeatures,
    ensureAddedToStyle,
    injectTomTomHeaders,
    updateLayersAndSource,
    updateStyleWithModule,
    waitUntilMapIsReady,
} from '../mapUtils';
import type { AbstractSourceWithLayers, GeoJSONSourceWithLayers } from '../SourceWithLayers';
import type { ToBeAddedLayerSpec, ToBeAddedLayerSpecWithoutSource } from '../types';
import { deserializedFeatureData, serializedFeatureData } from './featureDeserialization.test.data';
import updateStyleData from './mapUtils.test.data';

const getTomTomMapMock = async (mapReady: boolean[]) =>
    ({
        mapReady: vi.fn().mockReturnValue(mapReady[0]).mockReturnValue(mapReady[1]).mockReturnValue(mapReady[2]),
        mapLibreMap: {
            once: vi.fn((_, callback) => callback()),
        },
        _eventsProxy: {
            add: vi.fn(),
        },
    }) as unknown as TomTomMap;

describe('Map utils - waitUntilMapIsReady', () => {
    test('waitUntilMapIsReady resolve promise when mapReady or maplibre.isStyleLoaded are true', async () => {
        const tomtomMapMock = await getTomTomMapMock([true]);
        await expect(waitUntilMapIsReady(tomtomMapMock)).resolves.not.toThrow();
    });

    test('waitUntilMapIsReady resolve promise from mapLibre event once("styledata")', async () => {
        const tomtomMapMock = await getTomTomMapMock([false, true]);
        await expect(waitUntilMapIsReady(tomtomMapMock)).resolves.not.toThrow();
    });

    test(
        'waitUntilMapIsReady resolve promise from mapLibre event once("styledata") ' +
            'while map is not ready after first event, likely due to subsequent setStyle call',
        async () => {
            const tomtomMapMock = await getTomTomMapMock([false, false, true]);
            await expect(waitUntilMapIsReady(tomtomMapMock)).resolves.not.toThrow();
        },
    );
});

describe('Map utils - deserializeFeatures', () => {
    test('Should parse MapGeoJSONFeature', () => {
        deserializeFeatures(serializedFeatureData as unknown as MapGeoJSONFeature[]);
        const [topFeature] = serializedFeatureData;
        expect(topFeature.properties).toMatchObject(deserializedFeatureData);
    });
});

describe('Map utils - injectCustomHeaders', () => {
    test('Return only url if it is not TomTom domain', () => {
        const url = 'https://test.com';
        const transformRequestFn = injectTomTomHeaders({});
        expect(transformRequestFn(url)).toEqual({ url });
    });

    test('Return custom headers if url if it is TomTom domain', () => {
        const url = 'https://tomtom.com';
        const transformRequestFn = injectTomTomHeaders({});
        const headers = transformRequestFn(url);
        expect(headers).toEqual({ url, headers: { 'TomTom-User-Agent': expect.any(String) } });
    });

    test('Return only url if it is TomTom domain but an image resource', () => {
        const url = 'https://tomtom.com';
        const transformRequestFn = injectTomTomHeaders({});

        expect(transformRequestFn(url, 'Image' as ResourceType)).toStrictEqual({ url });
    });
});

describe('Map utils - changeLayerProps', () => {
    test('all cases', () => {
        const newMapMock = (): Map =>
            ({
                getStyle: vi.fn().mockReturnValue({ layers: [poiLayerSpec] }),
                setLayoutProperty: vi.fn(),
                setPaintProperty: vi.fn(),
                setFilter: vi.fn(),
                setLayerZoomRange: vi.fn(),
                getMaxZoom: vi.fn().mockReturnValueOnce(20),
                getMinZoom: vi.fn().mockReturnValueOnce(3),
            }) as unknown as Map;

        let mapLibreMock = newMapMock();
        changeLayerProps({ id: 'layerX', layout: { prop0: 'value0' } }, { id: 'layerX' }, mapLibreMock);
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledTimes(1);
        expect(mapLibreMock.setPaintProperty).toHaveBeenCalledTimes(0);

        mapLibreMock = newMapMock();
        changeLayerProps({ id: 'layerX', layout: { prop0: 'a', prop1: 'b' } }, { id: 'layerX' }, mapLibreMock);
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledTimes(2);
        expect(mapLibreMock.setPaintProperty).toHaveBeenCalledTimes(0);

        mapLibreMock = newMapMock();
        changeLayerProps(
            { id: 'layerX', layout: { prop0: 'a', prop1: 'b' } },
            { id: 'layerX', layout: { prop0: 'old-a' } },
            mapLibreMock,
        );
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledTimes(2);
        expect(mapLibreMock.setPaintProperty).toHaveBeenCalledTimes(0);
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith('layerX', 'prop0', 'a', { validate: false });
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith('layerX', 'prop1', 'b', { validate: false });

        mapLibreMock = newMapMock();
        changeLayerProps(
            { id: 'layerX', layout: { prop0: 'a', prop1: 'b' } },
            { id: 'layerX', layout: { prop5: 'old-a' } },
            mapLibreMock,
        );
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith('layerX', 'prop5', undefined, {
            validate: false,
        });
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledTimes(3);
        expect(mapLibreMock.setPaintProperty).toHaveBeenCalledTimes(0);
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith('layerX', 'prop0', 'a', { validate: false });
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith('layerX', 'prop1', 'b', { validate: false });

        mapLibreMock = newMapMock();
        changeLayerProps(
            { id: 'layerY', layout: { prop0: 'value0' }, paint: { propA: '10' } },
            { id: 'layerY', paint: { propC: '20' } },
            mapLibreMock,
        );
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledTimes(1);
        expect(mapLibreMock.setPaintProperty).toHaveBeenCalledTimes(2);
        expect(mapLibreMock.setPaintProperty).toHaveBeenCalledWith('layerY', 'propC', undefined, {
            validate: false,
        });
        expect(mapLibreMock.setPaintProperty).toHaveBeenCalledWith('layerY', 'propA', '10', { validate: false });

        mapLibreMock = newMapMock();
        changeLayerProps(
            { id: 'layerY', filter: ['==', ['get', 'routeState'], 'selected'] },
            { id: 'layerY' },
            mapLibreMock,
        );
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledTimes(0);
        expect(mapLibreMock.setPaintProperty).toHaveBeenCalledTimes(0);
        expect(mapLibreMock.setFilter).toHaveBeenCalledTimes(1);
        expect(mapLibreMock.setFilter).toHaveBeenCalledWith('layerY', ['==', ['get', 'routeState'], 'selected'], {
            validate: false,
        });

        mapLibreMock = newMapMock();
        changeLayerProps({ id: 'layerY', minzoom: 5 }, { id: 'layerY' }, mapLibreMock);
        expect(mapLibreMock.setLayerZoomRange).toHaveBeenCalledTimes(1);
        expect(mapLibreMock.setLayerZoomRange).toHaveBeenCalledWith('layerY', 5, 20);

        mapLibreMock = newMapMock();
        changeLayerProps({ id: 'layerY', maxzoom: 15 }, { id: 'layerY' }, mapLibreMock);
        expect(mapLibreMock.setLayerZoomRange).toHaveBeenCalledTimes(1);
        expect(mapLibreMock.setLayerZoomRange).toHaveBeenCalledWith('layerY', 3, 15);
    });
});

describe('Map utils - updateLayersAndSource', () => {
    test('all cases', () => {
        const newMapMock = (): Map =>
            ({
                removeLayer: vi.fn(),
                setLayoutProperty: vi.fn(),
                setPaintProperty: vi.fn(),
                setFilter: vi.fn(),
            }) as unknown as Map;

        // empty arrays
        updateLayersAndSource(
            [],
            [],
            { _updateSourceAndLayerIDs: vi.fn() } as unknown as AbstractSourceWithLayers,
            newMapMock(),
        );

        // remove one layer
        let mapMock = newMapMock();
        const someId = 'someId';

        const sourceWithLayersMock = {
            _layerSpecs: [{ id: someId }],
            _updateSourceAndLayerIDs: vi.fn(),
        };

        updateLayersAndSource(
            [],
            [{ id: someId } as ToBeAddedLayerSpecWithoutSource],
            sourceWithLayersMock as unknown as GeoJSONSourceWithLayers,
            mapMock,
        );
        expect(mapMock.removeLayer).toHaveBeenCalledTimes(1);
        expect(sourceWithLayersMock._updateSourceAndLayerIDs).toHaveBeenCalled();

        const sourceWithLayersMock2 = {
            source: { id: 'sourceId' },
            _layerSpecs: [{ id: someId }],
            _updateSourceAndLayerIDs: vi.fn(),
        };

        // add one layer
        mapMock = newMapMock();
        updateLayersAndSource(
            [{ id: someId } as ToBeAddedLayerSpecWithoutSource],
            [],
            sourceWithLayersMock2 as unknown as GeoJSONSourceWithLayers,
            mapMock,
        );

        // update one layer
        mapMock = newMapMock();
        updateLayersAndSource(
            [{ id: 'layerX', type: 'line', layout: { prop0: 'value0' } } as ToBeAddedLayerSpecWithoutSource],
            [{ id: 'layerX', type: 'line' }],
            sourceWithLayersMock2 as unknown as GeoJSONSourceWithLayers,
            mapMock,
        );
        expect(mapMock.setLayoutProperty).toHaveBeenCalledTimes(1);
        expect(mapMock.setFilter).toHaveBeenCalledTimes(1);
        expect(mapMock.setPaintProperty).toHaveBeenCalledTimes(0);
        expect(sourceWithLayersMock2._updateSourceAndLayerIDs).toHaveBeenCalledTimes(2);
    });
});

describe('Map utils - addLayersInCorrectOrder', () => {
    test('empty list case', () => {
        const mapMock = {} as unknown as Map;
        addLayers([], mapMock);
    });

    test('complex case with ordering', () => {
        // adding a complex case
        const mapMock = {
            addLayer: vi.fn(),
            setLayoutProperty: vi.fn(),
            getLayer: vi
                .fn()
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce({})
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce(undefined),
        } as unknown as Map;
        const id1 = 'id1';
        const id2 = 'id2';
        const id3 = 'id3';
        const id4 = 'id4';
        const id5 = 'id5';
        const existingId = 'existing id';
        const layer1 = { id: id1, beforeID: id2 } as ToBeAddedLayerSpec;
        const layer2 = { id: id2, beforeID: id4 } as ToBeAddedLayerSpec;
        const layer3 = { id: id3, beforeID: id4 } as ToBeAddedLayerSpec;
        const layer4 = { id: id4, beforeID: existingId } as ToBeAddedLayerSpec;
        const layer5 = { id: id5 } as ToBeAddedLayerSpec;
        addLayers([layer1, layer2, layer3, layer4, layer5], mapMock);
        expect(mapMock.getLayer).toHaveBeenNthCalledWith(1, id2);
        expect(mapMock.getLayer).toHaveBeenNthCalledWith(2, id4);
        expect(mapMock.getLayer).toHaveBeenNthCalledWith(3, id4);
        expect(mapMock.getLayer).toHaveBeenNthCalledWith(4, existingId);
        expect(mapMock.getLayer).toHaveBeenNthCalledWith(5, id4);
        expect(mapMock.getLayer).toHaveBeenNthCalledWith(6, id5);
        expect(mapMock.getLayer).toHaveBeenNthCalledWith(7, id2);
        expect(mapMock.getLayer).toHaveBeenNthCalledWith(8, id3);
        expect(mapMock.getLayer).toHaveBeenNthCalledWith(9, id1);
        expect(mapMock.addLayer).toHaveBeenCalledTimes(5);
        expect(mapMock.getLayer).toHaveBeenCalledTimes(9);
    });

    test('error case', () => {
        const mapMock = {
            getLayer: vi.fn().mockReturnValueOnce(undefined).mockReturnValueOnce(undefined),
        } as unknown as Map;
        const id1 = 'id1';
        const id2 = 'id2';
        const layer1 = { id: id1, beforeID: id2 } as ToBeAddedLayerSpec;
        const layer2 = { id: id2, beforeID: id1 } as ToBeAddedLayerSpec;
        expect(() => addLayers([layer1, layer2], mapMock)).toThrow();
    });
});

describe('Map utils - updateStyleWithStyleModule', () => {
    test('error case', () => {
        expect(() => updateStyleWithModule({ type: 'custom' }, 'trafficIncidents')).toThrow();
    });

    test.each(
        updateStyleData,
    )(`'%s`, (_name: string, styleInput: StyleInput | null, styleModule: StyleModule, styleOutput: StyleInput) => {
        // @ts-ignore
        expect(updateStyleWithModule(styleInput ? styleInput : undefined, styleModule)).toEqual(styleOutput);
    });
});

describe('Map utils - tryToAddSourceToMapIfMissing', () => {
    test('Initializing module with source', async () => {
        const hillshadeSource = { id: HILLSHADE_SOURCE_ID };
        const mapMock = {
            mapLibreMap: {
                getSource: vi.fn().mockReturnValueOnce(hillshadeSource),
                isStyleLoaded: vi.fn().mockReturnValue(true),
                once: vi.fn().mockReturnValue(Promise.resolve()),
            } as unknown as Map,
            _eventsProxy: {
                add: vi.fn(),
                ensureAdded: vi.fn(),
            },
            addStyleChangeHandler: vi.fn(),
            mapReady: vi.fn().mockReturnValue(false).mockReturnValue(true),
        } as unknown as TomTomMap;

        await ensureAddedToStyle(mapMock, HILLSHADE_SOURCE_ID, 'hillshade');
        expect(mapMock.mapLibreMap.getSource).toHaveBeenCalled();
    });

    test('Initializing module with no source', async () => {
        const tomtomMapMock = {
            mapLibreMap: {
                getSource: vi.fn().mockReturnValueOnce(undefined).mockReturnValueOnce(vi.fn()),
                isStyleLoaded: vi.fn().mockReturnValue(true),
                isSourceLoaded: vi.fn().mockReturnValue(true),
                once: vi.fn().mockReturnValue(Promise.resolve()),
            } as unknown as Map,
            _eventsProxy: {
                add: vi.fn(),
                ensureAdded: vi.fn(),
            },
            addStyleChangeHandler: vi.fn(),
            getStyle: vi.fn(),
            setStyle: vi.fn(),
            mapReady: vi.fn().mockReturnValue(false).mockReturnValue(true),
        } as unknown as TomTomMap;

        await ensureAddedToStyle(tomtomMapMock, HILLSHADE_SOURCE_ID, 'hillshade');
        expect(tomtomMapMock.getStyle).toHaveBeenCalled();
        expect(tomtomMapMock.setStyle).toHaveBeenCalled();
        expect(tomtomMapMock.mapLibreMap.isStyleLoaded).toHaveBeenCalledTimes(1);
        expect(tomtomMapMock.mapLibreMap.getSource).toHaveBeenCalled();
    });
});

describe('addOrUpdateImage tests', () => {
    test('Add image while map already has it', () => {
        const mapLibreMock = {
            loadImage: vi.fn().mockResolvedValue(vi.fn()),
            addImage: vi.fn(),
            hasImage: vi.fn().mockReturnValue(true),
        } as unknown as Map;

        vi.spyOn(mapLibreMock, 'addImage');
        expect(async () =>
            addOrUpdateImage('if-not-in-sprite', 'restaurant', 'https: //test.com', mapLibreMock),
        ).not.toThrow();
    });

    test('Add image with race condition, when map already has it right after loading it', () => {
        const mapLibreMock = {
            loadImage: vi.fn().mockResolvedValue({ data: {} }),
            addImage: vi.fn(),
            hasImage: vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true),
        } as unknown as Map;

        expect(async () =>
            addOrUpdateImage('add-or-update', 'restaurant', 'https://test.com', mapLibreMock),
        ).not.toThrow();
        expect(mapLibreMock.loadImage).toHaveBeenCalledTimes(1);
    });

    test('Add image to map successfully', async () => {
        const mapLibreMock = {
            loadImage: vi.fn().mockResolvedValue(vi.fn()),
            addImage: vi.fn(),
            hasImage: vi.fn().mockReturnValue(false),
        } as unknown as Map;
        expect(async () =>
            addOrUpdateImage('if-not-in-sprite', 'restaurant', 'https://test.com', mapLibreMock, { pixelRatio: 1 }),
        ).not.toThrow();
        expect(mapLibreMock.loadImage).toHaveBeenCalledTimes(1);
    });

    test('Add image while map load image has an error', async () => {
        const error = new Error('image not found');
        const mapLibreMock = {
            loadImage: vi.fn().mockRejectedValue(error),
            addImage: vi.fn(),
            hasImage: vi.fn().mockReturnValue(false),
        } as unknown as Map;

        await expect(async () =>
            addOrUpdateImage('if-not-in-sprite', 'restaurant', 'https://test.com', mapLibreMock),
        ).rejects.toMatchObject(error);
    });
});
