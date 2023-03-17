import { FeatureCollection } from "geojson";
import omit from "lodash/omit";
import { LayerSpecification, Map, MapGeoJSONFeature, ResourceType } from "maplibre-gl";
import { GeoJSONSourceWithLayers } from "../index";
import { TomTomMap } from "../../TomTomMap";
import { deserializeFeatures, injectCustomHeaders, mapToInternalFeatures, waitUntilMapIsReady } from "../mapUtils";
import { deserializedFeatureData, serializedFeatureData } from "./featureDeserialization.test.data";
import mockedFeatures from "./mapToInternalFeature.test.data.json";

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

describe("Map utils - mapToInternalFeature", () => {
    const testSourceID = "SOURCE_ID";
    const layer0 = { id: "layer0", type: "symbol", source: testSourceID } as LayerSpecification;
    const layer1 = { id: "layer1", type: "symbol", source: testSourceID } as LayerSpecification;
    const testToBeAddedLayerSpecs = [omit(layer0, "source"), omit(layer1, "source")];
    const [mockedFeature, rawMapFeature] = mockedFeatures;

    test("Map raw features to internal features", () => {
        const mapLibreMock = {
            getSource: jest.fn().mockReturnValue({ id: testSourceID, setData: jest.fn() }),
            getLayer: jest.fn(),
            addLayer: jest.fn(),
            setLayoutProperty: jest.fn()
        } as unknown as Map;
        const sourceWithLayers = new GeoJSONSourceWithLayers(mapLibreMock, testSourceID, testToBeAddedLayerSpecs);
        const features = {
            type: "FeatureCollection",
            features: [mockedFeature]
        } as FeatureCollection;
        sourceWithLayers.show(features);

        expect(mapToInternalFeatures(sourceWithLayers, rawMapFeature as unknown as MapGeoJSONFeature)).toEqual(
            mockedFeature
        );
    });
});
