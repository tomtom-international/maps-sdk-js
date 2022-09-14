import geocode from "../Geocoding";
import { GeocodingResponseAPI } from "../types/APITypes";
import { putIntegrationTestsAPIKey } from "../../shared/tests/IntegrationTestUtils";
import { GeocodeAPIParseErrorResponse } from "../../shared/Errors";
import { GeocodingParams } from "../types/GeocodingParams";

describe("Geocoding test without API key", () => {
    test("Geocoding test without API key", async () => {
        await expect(geocode({ query: "" })).rejects.toBeInstanceOf(GeocodeAPIParseErrorResponse);
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
                        },
                        viewport: {
                            type: "Polygon",
                            coordinates: expect.any(Array)
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
            countrySet: [],
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
            },
            extendedPostalCodesFor: ["Addr", "Str", "Geo"],
            mapcodes: ["International"],
            view: "MA",
            geographyTypes: ["Municipality", "MunicipalitySubdivision"],
            language: "en-GB",
            radius: 1000000
        });
        expect(result).toMatchObject({
            type: "FeatureCollection",
            features: expect.any(Array)
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
                    } as never)
            }
        );
        expect(result).toMatchObject(customParserExample);
    });

    test("it should fail when passing invalid params", async () => {
        const invalidParams: GeocodingParams = {
            query: "amsterdam",
            typeahead: true,
            limit: 1500, // Invalid value, limit <= 100
            offset: 3,
            position: [4.81063, 51.85925],
            // Using ts-ignore as the view is an invalid value
            //@ts-ignore
            view: "MAA", // Invalid value, it should be of type View
            geographyType: ["Municipality", "MunicipalitySubdivision"],
            language: "en-GB",
            radius: 1000000
        };

        await expect(geocode(invalidParams)).rejects.toThrow("Validation error");
    });
});
