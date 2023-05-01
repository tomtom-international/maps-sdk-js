import { Map, MapGeoJSONFeature, ResourceType } from "maplibre-gl";
import { TomTomMap } from "../../TomTomMap";
import {
    addLayersInCorrectOrder,
    changeLayerProps,
    deserializeFeatures,
    injectCustomHeaders,
    checkForSourceAndTryToAddIfMissing,
    updateLayersAndSource,
    updateStyleWithModule,
    waitUntilMapIsReady
} from "../mapUtils";
import { deserializedFeatureData, serializedFeatureData } from "./featureDeserialization.test.data";
import poiLayerSpec from "../../places/tests/poiLayerSpec.data.json";
import { AbstractSourceWithLayers, GeoJSONSourceWithLayers } from "../SourceWithLayers";
import { ToBeAddedLayerSpec, ToBeAddedLayerSpecWithoutSource } from "../types";
import updateStyleData from "./mapUtils.test.data.json";
import { StyleInput, StyleModules } from "../../init";
import { HILLSHADE_SOURCE_ID } from "../layers/sourcesIDs";

const getTomTomMapMock = async (flag: boolean) =>
    ({
        mapReady: flag,
        mapLibreMap: {
            once: jest.fn((_, callback) => callback()),
            isStyleLoaded: jest.fn().mockReturnValue(flag)
        },
        _eventsProxy: {
            add: jest.fn()
        }
    } as unknown as TomTomMap);

describe("Map utils - waitUntilMapIsReady", () => {
    test("waitUntilMapIsReady resolve promise when mapReady or maplibre.isStyleLoaded are true", async () => {
        const tomtomMapMock = await getTomTomMapMock(true);
        await expect(waitUntilMapIsReady(tomtomMapMock)).resolves.toBeTruthy();
    });

    test('waitUntilMapIsReady resolve promise from mapLibre event once("styledata")', async () => {
        const tomtomMapMock = await getTomTomMapMock(false);
        await expect(waitUntilMapIsReady(tomtomMapMock)).resolves.toBeTruthy();
    });
});

describe("Map utils - deserializeFeatures", () => {
    test("Should parse MapGeoJSONFeature", () => {
        deserializeFeatures(serializedFeatureData as unknown as MapGeoJSONFeature[]);
        const [topFeature] = serializedFeatureData;
        expect(topFeature.properties).toMatchObject(deserializedFeatureData);
    });
});

describe("Map utils - injectCustomHeaders", () => {
    test("Return only url if it is not TomTom domain", () => {
        const url = "https://test.com";
        const transformRequestFn = injectCustomHeaders({});

        expect(transformRequestFn(url)).toStrictEqual({ url });
    });

    test("Return custom headers if url if it is TomTom domain", () => {
        const url = "https://tomtom.com";
        const transformRequestFn = injectCustomHeaders({});
        const headers = transformRequestFn(url);

        expect(headers).toMatchObject({
            url,
            headers: {
                "TomTom-User-Agent": expect.stringContaining("TomTomSDKsMapsJS")
            }
        });
    });

    test("Return only url if it is TomTom domain but an image resource", () => {
        const url = "https://tomtom.com";
        const transformRequestFn = injectCustomHeaders({});

        expect(transformRequestFn(url, "Image" as ResourceType)).toStrictEqual({ url });
    });
});

describe("Map utils - changeLayerProps", () => {
    test("all cases", () => {
        const newMapMock = (): Map =>
            ({
                getStyle: jest.fn().mockReturnValue({ layers: [poiLayerSpec] }),
                setLayoutProperty: jest.fn(),
                setPaintProperty: jest.fn(),
                setFilter: jest.fn(),
                setLayerZoomRange: jest.fn(),
                getMaxZoom: jest.fn().mockReturnValueOnce(20),
                getMinZoom: jest.fn().mockReturnValueOnce(3)
            } as unknown as Map);

        let mapLibreMock = newMapMock();
        changeLayerProps({ id: "layerX", layout: { prop0: "value0" } }, { id: "layerX" }, mapLibreMock);
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledTimes(1);
        expect(mapLibreMock.setPaintProperty).toHaveBeenCalledTimes(0);

        mapLibreMock = newMapMock();
        changeLayerProps({ id: "layerX", layout: { prop0: "a", prop1: "b" } }, { id: "layerX" }, mapLibreMock);
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledTimes(2);
        expect(mapLibreMock.setPaintProperty).toHaveBeenCalledTimes(0);

        mapLibreMock = newMapMock();
        changeLayerProps(
            { id: "layerX", layout: { prop0: "a", prop1: "b" } },
            { id: "layerX", layout: { prop0: "old-a" } },
            mapLibreMock
        );
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledTimes(2);
        expect(mapLibreMock.setPaintProperty).toHaveBeenCalledTimes(0);
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith("layerX", "prop0", "a", { validate: false });
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith("layerX", "prop1", "b", { validate: false });

        mapLibreMock = newMapMock();
        changeLayerProps(
            { id: "layerX", layout: { prop0: "a", prop1: "b" } },
            { id: "layerX", layout: { prop5: "old-a" } },
            mapLibreMock
        );
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith("layerX", "prop5", undefined, {
            validate: false
        });
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledTimes(3);
        expect(mapLibreMock.setPaintProperty).toHaveBeenCalledTimes(0);
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith("layerX", "prop0", "a", { validate: false });
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith("layerX", "prop1", "b", { validate: false });

        mapLibreMock = newMapMock();
        changeLayerProps(
            { id: "layerY", layout: { prop0: "value0" }, paint: { propA: "10" } },
            { id: "layerY", paint: { propC: "20" } },
            mapLibreMock
        );
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledTimes(1);
        expect(mapLibreMock.setPaintProperty).toHaveBeenCalledTimes(2);
        expect(mapLibreMock.setPaintProperty).toHaveBeenCalledWith("layerY", "propC", undefined, {
            validate: false
        });
        expect(mapLibreMock.setPaintProperty).toHaveBeenCalledWith("layerY", "propA", "10", { validate: false });

        mapLibreMock = newMapMock();
        changeLayerProps(
            { id: "layerY", filter: ["==", ["get", "routeStyle"], "selected"] },
            { id: "layerY" },
            mapLibreMock
        );
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledTimes(0);
        expect(mapLibreMock.setPaintProperty).toHaveBeenCalledTimes(0);
        expect(mapLibreMock.setFilter).toHaveBeenCalledTimes(1);
        expect(mapLibreMock.setFilter).toHaveBeenCalledWith("layerY", ["==", ["get", "routeStyle"], "selected"], {
            validate: false
        });

        mapLibreMock = newMapMock();
        changeLayerProps({ id: "layerY", minzoom: 5 }, { id: "layerY" }, mapLibreMock);
        expect(mapLibreMock.setLayerZoomRange).toHaveBeenCalledTimes(1);
        expect(mapLibreMock.setLayerZoomRange).toHaveBeenCalledWith("layerY", 5, 20);

        mapLibreMock = newMapMock();
        changeLayerProps({ id: "layerY", maxzoom: 15 }, { id: "layerY" }, mapLibreMock);
        expect(mapLibreMock.setLayerZoomRange).toHaveBeenCalledTimes(1);
        expect(mapLibreMock.setLayerZoomRange).toHaveBeenCalledWith("layerY", 3, 15);
    });
});

describe("Map utils - updateLayersAndSource", () => {
    test("all cases", () => {
        const newMapMock = (): Map =>
            ({
                removeLayer: jest.fn(),
                setLayoutProperty: jest.fn(),
                setPaintProperty: jest.fn(),
                setFilter: jest.fn()
            } as unknown as Map);

        // empty arrays
        updateLayersAndSource([], [], {} as AbstractSourceWithLayers, newMapMock());

        // remove one layer
        let mapMock = newMapMock();
        const someId = "someId";
        updateLayersAndSource(
            [],
            [{ id: someId } as ToBeAddedLayerSpecWithoutSource],
            { _layerSpecs: [{ id: someId }] } as GeoJSONSourceWithLayers,
            mapMock
        );
        expect(mapMock.removeLayer).toHaveBeenCalledTimes(1);

        // add one layer
        mapMock = newMapMock();
        updateLayersAndSource(
            [{ id: someId } as ToBeAddedLayerSpecWithoutSource],
            [],
            { source: { id: "sourceId" }, _layerSpecs: [{ id: someId }] } as GeoJSONSourceWithLayers,
            mapMock
        );

        // update one layer
        mapMock = newMapMock();
        updateLayersAndSource(
            [{ id: "layerX", type: "line", layout: { prop0: "value0" } } as ToBeAddedLayerSpecWithoutSource],
            [{ id: "layerX", type: "line" }],
            { source: { id: "sourceId" }, _layerSpecs: [{ id: someId }] } as GeoJSONSourceWithLayers,
            mapMock
        );
        expect(mapMock.setLayoutProperty).toHaveBeenCalledTimes(1);
        expect(mapMock.setFilter).toHaveBeenCalledTimes(1);
        expect(mapMock.setPaintProperty).toHaveBeenCalledTimes(0);
    });
});
describe("Map utils - addLayersInCorrectOrder", () => {
    test("empty list case", () => {
        const mapMock = {} as unknown as Map;
        addLayersInCorrectOrder([], mapMock);
    });

    test("complex case with ordering", () => {
        // adding complex case
        const mapMock = {
            addLayer: jest.fn(),
            setLayoutProperty: jest.fn(),
            getLayer: jest
                .fn()
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce({})
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce(undefined)
        } as unknown as Map;
        const id1 = "id1";
        const id2 = "id2";
        const id3 = "id3";
        const id4 = "id4";
        const id5 = "id5";
        const existingId = "existing id";
        const layer1 = { id: id1, beforeID: id2 } as ToBeAddedLayerSpec;
        const layer2 = { id: id2, beforeID: id4 } as ToBeAddedLayerSpec;
        const layer3 = { id: id3, beforeID: id4 } as ToBeAddedLayerSpec;
        const layer4 = { id: id4, beforeID: existingId } as ToBeAddedLayerSpec;
        const layer5 = { id: id5 } as ToBeAddedLayerSpec;
        addLayersInCorrectOrder([layer1, layer2, layer3, layer4, layer5], mapMock);
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
        expect(mapMock.setLayoutProperty).toHaveBeenCalledTimes(5);
    });

    test("error case", () => {
        const mapMock = {
            getLayer: jest.fn().mockReturnValueOnce(undefined).mockReturnValueOnce(undefined)
        } as unknown as Map;
        const id1 = "id1";
        const id2 = "id2";
        const layer1 = { id: id1, beforeID: id2 } as ToBeAddedLayerSpec;
        const layer2 = { id: id2, beforeID: id1 } as ToBeAddedLayerSpec;
        expect(() => addLayersInCorrectOrder([layer1, layer2], mapMock)).toThrow();
    });
});

describe("Map utils - updateStyleWithStyleModule", () => {
    test("error case", () => {
        expect(() => updateStyleWithModule({ type: "custom" }, "poi")).toThrow();
    });

    test.each(updateStyleData)(
        `'%s`,
        // @ts-ignore
        (_name: string, styleInput: StyleInput, styleModule: StyleModules, styleOutput: StyleInput) => {
            expect(updateStyleWithModule(styleInput ? styleInput : undefined, styleModule)).toEqual(styleOutput);
        }
    );
});

describe("Map utils - tryToAddSourceToMapIfMissing", () => {
    test("Initializing module with source", async () => {
        const hillshadeSource = { id: HILLSHADE_SOURCE_ID };
        const tomtomMapMock = {
            mapLibreMap: {
                getSource: jest.fn().mockReturnValueOnce(hillshadeSource),
                isStyleLoaded: jest.fn().mockReturnValue(true)
            } as unknown as Map,
            _eventsProxy: {
                add: jest.fn(),
                ensureAdded: jest.fn()
            },
            _addStyleChangeHandler: jest.fn()
        } as unknown as TomTomMap;

        await checkForSourceAndTryToAddIfMissing(tomtomMapMock, HILLSHADE_SOURCE_ID, "hillshade");
        expect(tomtomMapMock.mapLibreMap.isStyleLoaded).toHaveBeenCalled();
        expect(tomtomMapMock.mapLibreMap.getSource).toHaveBeenCalled();
    });
    test("Initializing module with no source", async () => {
        const tomtomMapMock = {
            mapLibreMap: {
                getSource: jest.fn().mockReturnValueOnce(undefined),
                isStyleLoaded: jest.fn().mockReturnValue(true)
            } as unknown as Map,
            _eventsProxy: {
                add: jest.fn(),
                ensureAdded: jest.fn()
            },
            _addStyleChangeHandler: jest.fn(),
            getStyle: jest.fn(),
            setStyle: jest.fn()
        } as unknown as TomTomMap;

        await checkForSourceAndTryToAddIfMissing(tomtomMapMock, HILLSHADE_SOURCE_ID, "hillshade");
        expect(tomtomMapMock.getStyle).toHaveBeenCalled();
        expect(tomtomMapMock.setStyle).toHaveBeenCalled();
        expect(tomtomMapMock.mapLibreMap.isStyleLoaded).toHaveBeenCalledTimes(2);
        expect(tomtomMapMock.mapLibreMap.getSource).toHaveBeenCalled();
    });
});
