import { GOSDKMap } from "../../GOSDKMap";
import { deserializeFeatures, waitUntilMapIsReady } from "../mapUtils";
import featureData from "./featureDeserialization.test.data.json";

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

const deserializedResult = {
    type: "POI",
    score: 2.1455004215,
    info: "search:ta:826009035916969-GB",
    address: {
        streetNumber: "9",
        streetName: "Broadway",
        municipalitySubdivision: "Westminster",
        municipality: "London",
        countrySecondarySubdivision: "London",
        countrySubdivision: "ENG",
        countrySubdivisionName: "England",
        postalCode: "SW1H",
        extendedPostalCode: "SW1H 0AZ",
        countryCode: "GB",
        country: "United Kingdom",
        countryCodeISO3: "GBR",
        freeformAddress: "9 Broadway, Westminster, London, SW1H 0AZ",
        localName: "London"
    },
    entryPoints: [
        {
            type: "main",
            position: [-0.13356, 51.49898]
        }
    ],
    poi: {
        name: "Dolphins Pharmacy",
        categories: ["pharmacy"],
        classifications: [
            {
                code: "PHARMACY",
                names: [
                    {
                        nameLocale: "en-US",
                        name: "pharmacy"
                    }
                ]
            }
        ],
        brands: [],
        categoryIds: [7326]
    },
    title: "Dolphins Pharmacy",
    iconID: "254_pin"
};

describe("Map utils - deserializeFeatures", () => {
    it("Should parse MapGeoJSONFeature", () => {
        // @ts-ignore
        deserializeFeatures(featureData);
        const [topFeature] = featureData;
        expect(topFeature.properties).toMatchObject(deserializedResult);
    });
});
