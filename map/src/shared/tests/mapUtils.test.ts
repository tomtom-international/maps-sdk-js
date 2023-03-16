import { Map, MapGeoJSONFeature, ResourceType } from "maplibre-gl";
import { TomTomMap } from "../../TomTomMap";
import { changeLayoutAndPaintProps, deserializeFeatures, injectCustomHeaders, waitUntilMapIsReady } from "../mapUtils";
import { deserializedFeatureData, serializedFeatureData } from "./featureDeserialization.test.data";
import poiLayerSpec from "../../places/tests/poiLayerSpec.data.json";

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
                "TomTom-User-Agent": expect.stringContaining("MapsSDKJS")
            }
        });
    });

    test("Return only url if it is TomTom domain but an image resource", () => {
        const url = "https://tomtom.com";
        const transformRequestFn = injectCustomHeaders({});

        expect(transformRequestFn(url, "Image" as ResourceType)).toStrictEqual({ url });
    });
});

test("changeLayoutAndPaintProps", () => {
    const newMapMock = (): Map =>
        ({
            getStyle: jest.fn().mockReturnValue({ layers: [poiLayerSpec] }),
            setLayoutProperty: jest.fn(),
            setPaintProperty: jest.fn()
        } as unknown as Map);

    let mapLibreMock = newMapMock();
    changeLayoutAndPaintProps({ id: "layerX", layout: { prop0: "value0" } }, { id: "layerX" }, mapLibreMock);
    expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledTimes(1);
    expect(mapLibreMock.setPaintProperty).toHaveBeenCalledTimes(0);

    mapLibreMock = newMapMock();
    changeLayoutAndPaintProps({ id: "layerX", layout: { prop0: "a", prop1: "b" } }, { id: "layerX" }, mapLibreMock);
    expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledTimes(2);
    expect(mapLibreMock.setPaintProperty).toHaveBeenCalledTimes(0);

    mapLibreMock = newMapMock();
    changeLayoutAndPaintProps(
        { id: "layerX", layout: { prop0: "a", prop1: "b" } },
        { id: "layerX", layout: { prop0: "old-a" } },
        mapLibreMock
    );
    expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledTimes(2);
    expect(mapLibreMock.setPaintProperty).toHaveBeenCalledTimes(0);
    expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith("layerX", "prop0", "a", { validate: false });
    expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith("layerX", "prop1", "b", { validate: false });

    mapLibreMock = newMapMock();
    changeLayoutAndPaintProps(
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
    changeLayoutAndPaintProps(
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
});
