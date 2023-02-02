import { MapGeoJSONFeature } from "maplibre-gl";
import { GOSDKMap } from "../../GOSDKMap";
import { deserializeFeatures, injectCustomHeaders, waitUntilMapIsReady } from "../mapUtils";
import { deserializedFeatureData, serializedFeatureData } from "./featureDeserialization.test.data";

const getGOSDKMapMock = async (flag: boolean) =>
    ({
        mapReady: flag,
        mapLibreMap: {
            once: jest.fn((_, callback) => callback()),
            isStyleLoaded: jest.fn().mockReturnValue(flag)
        },
        _eventsProxy: {
            add: jest.fn()
        }
    } as unknown as GOSDKMap);

describe("Map utils - waitUntilMapIsReady", () => {
    test("waitUntilMapIsReady resolve promise when mapReady or maplibre.isStyleLoaded are true", async () => {
        const goSDKMapMock = await getGOSDKMapMock(true);
        await expect(waitUntilMapIsReady(goSDKMapMock)).resolves.toBeTruthy();
    });

    test('waitUntilMapIsReady resolve promise from mapLibre event once("styledata")', async () => {
        const goSDKMapMock = await getGOSDKMapMock(false);
        await expect(waitUntilMapIsReady(goSDKMapMock)).resolves.toBeTruthy();
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
        const url = "http://test.com";
        const transformRequestFn = injectCustomHeaders({});

        expect(transformRequestFn(url)).toStrictEqual({ url });
    });

    test("Return custom headers if url if it is TomTom domain", () => {
        const url = "http://tomtom.com";
        const transformRequestFn = injectCustomHeaders({});
        const headers = transformRequestFn(url);

        expect(headers).toMatchObject({
            url,
            headers: {
                "Tracking-ID": expect.any(String),
                "TomTom-User-Agent": expect.stringContaining("WebGoSDK/")
            }
        });
    });

    test("Return only url if it is TomTom domain but an image resource", () => {
        const url = "http://tomtom.com";
        const transformRequestFn = injectCustomHeaders({});

        expect(transformRequestFn(url, "Image")).toStrictEqual({ url });
    });
});
