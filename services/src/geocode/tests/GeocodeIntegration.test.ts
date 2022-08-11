import { GOSDKConfig } from "@anw/go-sdk-js/core";

import { singleResultExample, multiResultExample, customParserExample } from "./GeocodingIntegration.data";
import geocode from "../Geocoding";
import { GeocodingResponseAPI, GeocodingResponse } from "../types";

describe("Geocoding test without API key", () => {
    test("Geocoding test without API key", async () => {
        await expect(geocode({ query: "" })).rejects.toEqual(403);
    });
});

describe("Geocoding integration tests", () => {
    beforeAll(() => {
        GOSDKConfig.instance.put({
            apiKey: "XVxgvGPnXxuAHlFcKu1mBTGupVwhVlOE"
        });
    });

    test("Geocoding single results", async () => {
        const result = await geocode({ query: "teakhout zaandam" });
        expect(result).toMatchObject(singleResultExample);
    });

    test("Geocoding multi results", async () => {
        const result = await geocode({ query: "teakhout" });
        expect(result).toMatchObject(multiResultExample);
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
            entityTypeSet: ["Municipality", "MunicipalitySubdivision"],
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
        const result = await geocode(
            { query: "teakhout" },
            {
                parseResponse: (_params, response: GeocodingResponseAPI) => ({
                    result: response.results[0],
                    summary: response.summary
                })
            }
        );
        expect(result).toMatchObject(customParserExample);
    });
});
