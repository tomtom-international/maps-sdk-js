import { Fuel, GOSDKConfig, Place } from "@anw/go-sdk-js/core";

import { buildGeometrySearchRequest, geometrySearch, parseGeometrySearchResponse } from "..";
import { GeometrySDK, GeometrySearchResponseProps, GeometrySearchResponse } from "../types";
import { IndexTypesAbbreviation } from "../../shared/types/APIResponseTypes";

describe("Geometry Search API", () => {
    const geometries: GeometrySDK[] = [
        {
            type: "Polygon",
            coordinates: [
                [
                    [37.7524152343544, -122.43576049804686],
                    [37.70660472542312, -122.4330139160156],
                    [37.712059855877314, -122.36434936523438],
                    [37.75350561243041, -122.37396240234374]
                ]
            ]
        },
        {
            type: "Circle",
            coordinates: [37.71205, -121.36434],
            radius: 6000
        }
    ];

    beforeAll(() => {
        GOSDKConfig.instance.put({ apiKey: process.env.API_KEY });
    });

    test("geometrySearchAPI.searchByGeometry works", async () => {
        const query = "cafe";
        const categories: number[] = [];
        const fuels: Fuel[] = [];
        const language = "en-GB";
        const view = "Unified";
        const timeZone = "iana";
        const openingHours = "nextSevenDays";
        const limit = 5;
        const indexes: IndexTypesAbbreviation[] = ["POI"];
        const res = await geometrySearch({
            query,
            geometries,
            poiCategories: categories,
            fuels,
            language,
            limit,
            indexes,
            view,
            timeZone,
            openingHours
        });

        expect(res.features).toHaveLength(limit);

        expect(res).toEqual(
            expect.objectContaining<GeometrySearchResponse>({
                type: "FeatureCollection",
                features: expect.arrayContaining<Place<GeometrySearchResponseProps>>([
                    expect.objectContaining<Place<GeometrySearchResponseProps>>({
                        type: "Feature",
                        geometry: expect.objectContaining({
                            coordinates: expect.arrayContaining([expect.any(Number), expect.any(Number)]),
                            type: expect.any(String)
                        }),
                        properties: expect.objectContaining<GeometrySearchResponseProps>({
                            type: "POI",
                            address: expect.any(Object),
                            entryPoints: expect.arrayContaining([expect.any(Object)]),
                            poi: expect.objectContaining({
                                name: expect.any(String),
                                classifications: expect.any(Array),
                                brands: expect.any(Array),
                                categoryIds: expect.arrayContaining([expect.any(Number)])
                            })
                        })
                    })
                ])
            })
        );
    });

    test("geometrySearchAPI.searchByGeometry fails to convert unsupported geometry types", async () => {
        const query = "cafe";
        const type = "UnknownType";
        const incorrectGeometry = [
            {
                type,
                coordinates: [37.71205, -121.36434],
                radius: 6000
            }
        ];
        // @ts-ignore
        await expect(geometrySearch({ query, geometries: incorrectGeometry })).rejects.toMatchObject(
            expect.objectContaining({
                message: `Type ${type} is not supported`
            })
        );
    });

    test("geometrySearchAPI.searchByGeometry buildRequest hook modifies url", async () => {
        const query = "cafe";
        const newQuery = "petrol";
        const res = await geometrySearch(
            { query, geometries },
            {
                buildRequest: (params) => {
                    const req = buildGeometrySearchRequest(params);
                    req.url.pathname = req.url.pathname.replace(`${query}.json`, `${newQuery}.json`);
                    return req;
                }
            }
        );

        expect(res).toEqual(
            expect.objectContaining({
                type: "FeatureCollection",
                features: expect.arrayContaining([
                    expect.objectContaining({
                        properties: expect.objectContaining({
                            poi: expect.objectContaining({
                                categories: expect.arrayContaining([
                                    expect.stringContaining(newQuery),
                                    expect.not.stringContaining(query)
                                ])
                            })
                        })
                    })
                ])
            })
        );
    });

    test("geometrySearchAPI.searchByGeometry parseResponse hook modifies response", async () => {
        const query = "cafe";
        const res = await geometrySearch(
            { query, geometries },
            {
                parseResponse: (apiResponse) => {
                    const response = parseGeometrySearchResponse(apiResponse);
                    response.bbox = [0, 0, 0, 0];
                    return response;
                }
            }
        );

        expect(res).toEqual(
            expect.objectContaining({
                type: "FeatureCollection",
                bbox: [0, 0, 0, 0]
            })
        );
    });
});
