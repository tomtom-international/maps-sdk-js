import parsedResponses from "./GeocodingIntegration.data.json";
import geocode from "../Geocoding";
import { GeocodingResponse } from "../types/GeocodingResponse";
import { GeocodingResponseAPI } from "../types/APITypes";
import { putIntegrationTestsAPIKey } from "../../shared/tests/IntegrationTestUtils";
import { SDKError } from "../../shared/Errors";
import { GeocodingParams } from "../types/GeocodingParams";

describe("Geocoding test without API key", () => {
    test("Geocoding test without API key", async () => {
        await expect(geocode({ query: "" })).rejects.toBeInstanceOf(SDKError);
        await expect(geocode({ query: "" })).rejects.toMatchObject({
            service: "Geocode",
            message: "Request failed with status code 403",
            status: 403
        });
    });
});

describe("Geocoding integration tests", () => {
    beforeAll(() => putIntegrationTestsAPIKey());

    test.each(parsedResponses)(
        `'%s`,
        // @ts-ignore
        async (_name: string, params: GeocodingParams, sdkResponse: never) => {
            expect(await geocode(params)).toMatchObject(sdkResponse);
        }
    );

    test("empty query", async ()=>{
        const result = await geocode({
            query:""
        })
        console.log(result)
    })

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
            geographyType: ["Municipality", "MunicipalitySubdivision"],
            language: "en-GB",
            radius: 1000000
        });
        expect(result).toMatchObject({
            type: "FeatureCollection",
            features: expect.any(Array)
        });
        expect((result as GeocodingResponse).features).toHaveLength(4);
    });

    test("Geocoding with template response override to get only the first raw result and summary", async () => {
        const customParserExample = {
            result: {
                type: "Street",
                score: 2.1169600487,
                matchConfidence: {
                    score: 1
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
                    lat: 52.44131,
                    lon: 4.8093
                },
                viewport: {
                    topLeftPoint: {
                        lat: 52.44179,
                        lon: 4.80845
                    },
                    btmRightPoint: {
                        lat: 52.44009,
                        lon: 4.81063
                    }
                }
            },
            summary: {
                query: "teakhout",
                queryType: "NON_NEAR",
                numResults: 4,
                offset: 0,
                totalResults: 4,
                fuzzyLevel: 1
            }
        };
        const result = await geocode(
            { query: "teakhout" },
            {
                parseResponse: (response: GeocodingResponseAPI) => ({
                    result: response.results[0],
                    summary: response.summary
                })
            }
        );
        expect(result).toMatchObject(customParserExample);
    });
});
