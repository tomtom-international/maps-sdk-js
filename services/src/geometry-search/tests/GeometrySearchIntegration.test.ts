import { Fuel, GeometryDataResponse, GOSDKConfig, Place, SearchPlaceProps } from "@anw/go-sdk-js/core";

import { geometrySearch } from "..";
import { parseGeometrySearchResponse } from "../ResponseParser";
import { buildGeometrySearchRequest } from "../RequestBuilder";
import { SearchGeometryInput, GeometrySearchResponse } from "../types";
import { IndexTypesAbbreviation } from "../../shared/types/APIResponseTypes";
import { baseSearchPlaceTestProps } from "../../shared/tests/IntegrationTestUtils";
import realGeometryDataInput from "./RealGeometryDataInput.json";

describe("Geometry Search service", () => {
    const geometries: SearchGeometryInput[] = [
        {
            type: "Polygon",
            coordinates: [
                [
                    [-122.43576, 37.75241],
                    [-122.433013, 37.7066],
                    [-122.364349, 37.71205],
                    [-122.373962, 37.7535]
                ]
            ]
        },
        {
            type: "Circle",
            coordinates: [-121.36434, 37.71205],
            radius: 6000
        }
    ];

    beforeAll(() => {
        GOSDKConfig.instance.put({ apiKey: process.env.API_KEY });
    });

    const expectWorkingResult = () =>
        expect.objectContaining<GeometrySearchResponse>({
            type: "FeatureCollection",
            features: expect.arrayContaining<Place<SearchPlaceProps>>([
                expect.objectContaining<Place<SearchPlaceProps>>({
                    type: "Feature",
                    id: expect.any(String),
                    geometry: expect.objectContaining({
                        coordinates: expect.arrayContaining([expect.any(Number), expect.any(Number)]),
                        type: expect.any(String)
                    }),
                    properties: expect.objectContaining<SearchPlaceProps>(baseSearchPlaceTestProps)
                })
            ])
        });

    test("geometrySearch works", async () => {
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
        expect(res).toEqual(expectWorkingResult());
    });

    test("geometrySearch fails to convert unsupported geometry types", async () => {
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
                message: `Validation error`
            })
        );
    });

    test("geometrySearch buildRequest hook modifies url", async () => {
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

    test("geometrySearch parseResponse hook modifies response", async () => {
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

    test("geometrySearch with real geometry data input from a geometry data call", async () => {
        const query = "university";
        const res = await geometrySearch({ query, geometries: [realGeometryDataInput as GeometryDataResponse] });
        expect(res).toEqual(expectWorkingResult());
    });
});
