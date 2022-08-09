import { GOSDKConfig } from "@anw/go-sdk-js/core";

import { singleResultExample, multiResultExample, customParserExample } from "./GeocodingIntegration.data";
import geocode from "../Geocoding";
import { GeocodingAPIResponse, GeocodingResponse } from "../types";

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
        expect(result).toEqual(
            expect.objectContaining({
                type: "FeatureCollection",
                features: expect.arrayContaining([
                    expect.objectContaining({
                        ...singleResultExample.features[0],
                        properties: {
                            ...singleResultExample.features[0].properties,
                            id: expect.any(String)
                        }
                    })
                ])
            })
        );
    });

    test("Geocoding multi results", async () => {
        const result = await geocode({ query: "teakhout" });
        expect(result).toHaveProperty("type", "FeatureCollection");
        expect(result).toHaveProperty("features", expect.any(Array));
        expect((result as GeocodingResponse).features).toHaveLength(4);
        (result as GeocodingResponse).features.forEach((feat, i) => {
            expect(feat).toEqual(
                expect.objectContaining({
                    ...multiResultExample.features[i],
                    properties: {
                        ...multiResultExample.features[i].properties,
                        id: expect.any(String)
                    }
                })
            );
        });
    });

    test("Geocoding with all parameters sent", async () => {
        const result = await geocode({
            query: "amsterdam",
            typeahead: true,
            limit: 15,
            ofs: 3,
            lat: 51.85925,
            lon: 4.81063,
            countrySet: [],
            topLeft: [51.85925, 5.16905],
            btmRight: [52.44009, 5.16957],
            extendedPostalCodesFor: ["Addr", "Str", "Geo"],
            mapcodes: ["International"],
            view: "MA",
            entityTypeSet: ["Municipality", "MunicipalitySubdivision"],
            language: "en-GB",
            radius: 1000000
        });
        expect(result).toEqual(
            expect.objectContaining({
                type: "FeatureCollection",
                features: expect.any(Array)
            })
        );
        expect((result as GeocodingResponse).features).toHaveLength(4);
    });

    test("Geocoding with template response override to get only the first raw result and summary", async () => {
        const result = await geocode(
            { query: "teakhout" },
            {
                parseResponse: (_params, response: GeocodingAPIResponse) => ({
                    result: response.results[0],
                    summary: response.summary
                })
            }
        );
        expect(result).toEqual(
            expect.objectContaining({
                result: {
                    ...customParserExample.result,
                    id: expect.any(String)
                },
                summary: {
                    ...customParserExample.summary,
                    queryTime: expect.any(Number)
                }
            })
        );
    });
});
