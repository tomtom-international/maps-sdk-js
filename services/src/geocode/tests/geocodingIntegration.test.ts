import { Polygon } from "geojson";
import geocode from "../geocoding";
import { GeocodingResponseAPI } from "../types/apiTypes";
import { putIntegrationTestsAPIKey } from "../../shared/tests/integrationTestUtils";
import { SDKServiceError } from "../../shared";

describe("Geocoding errors", () => {
    test("Geocoding test without API key", async () => {
        await expect(geocode({ query: "" })).rejects.toBeInstanceOf(SDKServiceError);
        await expect(geocode({ query: "" })).rejects.toMatchObject({
            service: "Geocode",
            message: "Request failed with status code 403",
            status: 403
        });
    });
});

describe("Geocoding integration tests", () => {
    beforeAll(() => putIntegrationTestsAPIKey());

    test("Geocoding with default params, expecting multiple results", async () => {
        const expectedResult = {
            type: "FeatureCollection",
            bbox: expect.any(Array),
            features: [
                {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: expect.any(Array)
                    },
                    properties: {
                        type: "Street",
                        score: expect.any(Number),
                        matchConfidence: {
                            score: expect.any(Number)
                        },
                        address: {
                            streetName: "Teakhout",
                            municipalitySubdivision: "Zaandam",
                            municipality: "Zaanstad",
                            countrySubdivision: "Noord-Holland",
                            countryCode: "NL",
                            country: "Nederland",
                            countryCodeISO3: "NLD",
                            freeformAddress: "Teakhout, Zaanstad",
                            localName: "Zaanstad"
                        }
                    }
                },
                {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: expect.any(Array)
                    },
                    properties: expect.any(Object)
                },
                {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: expect.any(Array)
                    },
                    properties: expect.any(Object)
                },
                {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: expect.any(Array)
                    },
                    properties: expect.any(Object)
                }
            ]
        };

        const result = await geocode({ query: "teakhout" });
        expect(result).toMatchObject(expectedResult);
    });

    test("Geocoding with all parameters sent", async () => {
        const result = await geocode({
            query: "amsterdam",
            typeahead: true,
            limit: 15,
            offset: 3,
            position: [4.81063, 51.85925],
            countries: [],
            boundingBox: {
                type: "Polygon",
                coordinates: [
                    [
                        [5.16905, 52.44009],
                        [5.16957, 52.44009],
                        [5.16957, 51.85925],
                        [5.16905, 51.85925],
                        [5.16905, 52.44009]
                    ]
                ]
            } as Polygon,
            extendedPostalCodesFor: ["Addr", "Str", "Geo"],
            mapcodes: ["International"],
            view: "MA",
            geographyTypes: ["Municipality", "MunicipalitySubdivision"],
            language: "en-GB",
            radiusMeters: 1000000
        });
        expect(result).toMatchObject({
            type: "FeatureCollection",
            bbox: expect.any(Array),
            features: expect.anything()
        });
        expect(result.features.length).toBeGreaterThan(3);
    });

    test("Geocoding with template response override to get only the first raw result and summary", async () => {
        const customParserExample = {
            result: {
                type: "Street",
                score: expect.any(Number),
                matchConfidence: {
                    score: expect.any(Number)
                },
                address: {
                    streetName: "Teakhout",
                    municipalitySubdivision: "Zaandam",
                    municipality: "Zaanstad",
                    countrySubdivision: "Noord-Holland",
                    countryCode: "NL",
                    country: "Nederland",
                    countryCodeISO3: "NLD",
                    freeformAddress: "Teakhout, Zaanstad",
                    localName: "Zaanstad"
                },
                position: {
                    lat: expect.any(Number),
                    lon: expect.any(Number)
                },
                viewport: {
                    topLeftPoint: {
                        lat: expect.any(Number),
                        lon: expect.any(Number)
                    },
                    btmRightPoint: {
                        lat: expect.any(Number),
                        lon: expect.any(Number)
                    }
                }
            },
            summary: {
                query: "teakhout",
                queryType: "NON_NEAR",
                numResults: expect.any(Number),
                offset: expect.any(Number),
                totalResults: expect.any(Number),
                fuzzyLevel: expect.any(Number)
            }
        };
        const result = await geocode(
            { query: "teakhout" },
            {
                parseResponse: (response: GeocodingResponseAPI) =>
                    ({
                        result: response.results[0],
                        summary: response.summary
                    }) as never
            }
        );
        expect(result).toMatchObject(customParserExample);
    });

    test("Geocoding with API response callback", async () => {
        const onAPIRequest = jest.fn() as (request: URL) => void;
        const onAPIResponse = jest.fn() as (request: URL, response: GeocodingResponseAPI) => void;
        const result = await geocode({ query: "Amsterdam", onAPIRequest, onAPIResponse });
        expect(result).toBeDefined();
        expect(onAPIRequest).toHaveBeenCalledWith(expect.any(URL));
        expect(onAPIResponse).toHaveBeenCalledWith(expect.any(URL), expect.anything());
    });
});
