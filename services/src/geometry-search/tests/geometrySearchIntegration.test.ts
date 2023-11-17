import { Fuel, PolygonFeatures, TomTomConfig, Place, POICategory, SearchPlaceProps } from "@anw/maps-sdk-js/core";
import { search } from "../../search";
import { parseGeometrySearchResponse } from "../responseParser";
import { buildGeometrySearchRequest } from "../requestBuilder";
import {
    GeometrySearchParams,
    GeometrySearchRequestAPI,
    GeometrySearchResponse,
    GeometrySearchResponseAPI,
    SearchGeometryInput
} from "../types";
import { IndexTypesAbbreviation } from "../../shared";
import { baseSearchPOITestProps } from "../../shared/tests/integrationTestUtils";
import realGeometryDataInput from "./realGeometryDataInput.json";
import hugeMultiPolygonDataInput from "./hugeMultiPolygonDataInput.json";
import { poiCategoriesToID } from "../../poi-categories/poiCategoriesToID";

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
        TomTomConfig.instance.put({ apiKey: process.env.API_KEY });
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
                    properties: expect.objectContaining<SearchPlaceProps>(baseSearchPOITestProps)
                })
            ])
        });

    test("geometrySearch works", async () => {
        const query = "cafe";
        const categories: number[] = [];
        const fuelTypes: Fuel[] = [];
        const language = "en-GB";
        const view = "Unified";
        const timeZone = "iana";
        const openingHours = "nextSevenDays";
        const limit = 5;
        const indexes: IndexTypesAbbreviation[] = ["POI"];
        const res = await search({
            query,
            geometries,
            poiCategories: categories,
            fuelTypes,
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

    test("geometrySearch with human-readable poi categories", async () => {
        const query = "restaurant";
        const poiCategories: (number | POICategory)[] = ["ITALIAN_RESTAURANT"];
        const categoryID = poiCategoriesToID["ITALIAN_RESTAURANT"];
        const language = "en-GB";
        const indexes: IndexTypesAbbreviation[] = ["POI"];
        const res = await search({
            query,
            geometries,
            poiCategories,
            language,
            indexes
        });

        expect(res.features).toEqual(
            expect.arrayContaining<GeometrySearchResponse>([
                expect.objectContaining({
                    properties: expect.objectContaining({
                        poi: expect.objectContaining({
                            categoryIds: expect.arrayContaining([categoryID])
                        })
                    })
                })
            ])
        );
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
        await expect(search({ query, geometries: incorrectGeometry })).rejects.toMatchObject(
            expect.objectContaining({
                message: "Invalid input"
            })
        );
    });

    test("geometrySearch buildRequest hook modifies url", async () => {
        const query = "cafe";
        const newQuery = "petrol";
        const res = await search(
            { query, geometries },
            {
                buildRequest: (params: GeometrySearchParams) => {
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
        const res = await search(
            { query, geometries },
            {
                parseResponse: (apiResponse: GeometrySearchResponseAPI) => {
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
        const res = await search({ query, geometries: [realGeometryDataInput as unknown as PolygonFeatures] });
        expect(res).toEqual(expectWorkingResult());
    });

    test("geometrySearch with huge multipolygon geometry data input from a geometry data call", async () => {
        const query = "university";
        const res = await search({ query, geometries: [hugeMultiPolygonDataInput as unknown as PolygonFeatures] });
        expect(res).toEqual(expectWorkingResult());
    });

    test("geometrySearch with API request and response callbacks", async () => {
        const onAPIRequest = jest.fn() as (request: GeometrySearchRequestAPI) => void;
        const onAPIResponse = jest.fn() as (
            request: GeometrySearchRequestAPI,
            response: GeometrySearchResponseAPI
        ) => void;
        const result = await search({ query: "cafe", geometries, onAPIRequest, onAPIResponse });
        expect(result).toBeDefined();
        const expectedAPIRequest = { url: expect.any(URL), data: expect.anything() };
        expect(onAPIRequest).toHaveBeenCalledWith(expectedAPIRequest);
        expect(onAPIResponse).toHaveBeenCalledWith(expectedAPIRequest, expect.anything());
    });
});
