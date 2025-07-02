import type { Fuel, Place, POICategory, SearchPlaceProps } from '@anw/maps-sdk-js/core';
import { TomTomConfig } from '@anw/maps-sdk-js/core';
import { search } from '../../search';
import type { FuzzySearchParams, FuzzySearchResponse, FuzzySearchResponseAPI } from '../types';
import type { SearchIndexType } from '../../shared';
import {
    baseSearchPlaceMandatoryProps,
    evStationBaseTestProps,
    expectPlaceTestFeature,
} from '../../shared/tests/integrationTestUtils';
import { poiCategoriesToID } from '../../poi-categories/poiCategoriesToID';
import { buildFuzzySearchRequest } from '../requestBuilder';
import { parseFuzzySearchResponse } from '../responseParser';

describe('Fuzzy Search service', () => {
    beforeAll(() => TomTomConfig.instance.put({ apiKey: process.env.API_KEY }));

    const expectWorkingResult = expect.objectContaining<FuzzySearchResponse>({
        type: 'FeatureCollection',
        features: expect.arrayContaining<Place<SearchPlaceProps>>([
            expect.objectContaining<Place<SearchPlaceProps>>({
                type: 'Feature',
                id: expect.any(String),
                geometry: expect.objectContaining({
                    coordinates: expect.arrayContaining([expect.any(Number), expect.any(Number)]),
                    type: expect.any(String),
                }),
                properties: expect.objectContaining<SearchPlaceProps>(baseSearchPlaceMandatoryProps),
            }),
        ]),
    });

    test('basic fuzzy search call', async () => {
        const res = await search({ query: 'pizza' });
        expect(res).toEqual(expectWorkingResult);
    });

    test('fuzzy search with multiple option parameters', async () => {
        const query = 'restaurant';
        const poiCategories: number[] = [];
        const fuelTypes: Fuel[] = [];
        const language = 'en-GB';
        const view = 'Unified';
        const timeZone = 'iana';
        const openingHours = 'nextSevenDays';
        const limit = 5;
        const indexes: SearchIndexType[] = ['POI'];
        const res = await search({
            query,
            poiCategories,
            fuelTypes,
            language,
            limit,
            indexes,
            view,
            timeZone,
            openingHours,
        });

        expect(res.features).toHaveLength(limit);
        expect(res).toEqual(expectWorkingResult);
    });

    test('fuzzy search for EV charging stations', async () => {
        const sanFrancisco = [-122.4194, 37.7749];
        const query = 'tesla';
        const evStations = await search({
            query,
            poiCategories: ['ELECTRIC_VEHICLE_STATION'],
            limit: 10,
            position: sanFrancisco,
        });

        expect(evStations?.features?.length).toBeGreaterThan(0);
        expect(evStations).toEqual({
            type: 'FeatureCollection',
            bbox: expect.any(Array),
            properties: expect.objectContaining({ query, geoBias: sanFrancisco }),
            features: expect.arrayContaining([expectPlaceTestFeature(evStationBaseTestProps)]),
        });
    });

    test('fuzzy search with a combination of poi category IDs & human readable poi category names', async () => {
        const query = 'restaurant';
        const poiCategories: (number | POICategory)[] = ['SPANISH_RESTAURANT', 'ITALIAN_RESTAURANT', 7315017];
        const language = 'en-GB';
        const indexes: SearchIndexType[] = ['POI'];
        const res = await search({
            query,
            poiCategories,
            language,
            indexes,
            limit: 50,
        });

        expect(res.features).toEqual(
            expect.arrayContaining<FuzzySearchResponse>([
                expect.objectContaining({
                    properties: expect.objectContaining({
                        poi: expect.objectContaining({
                            categoryIds: expect.arrayContaining([poiCategoriesToID['ITALIAN_RESTAURANT']]),
                        }),
                    }),
                }),
                expect.objectContaining({
                    properties: expect.objectContaining({
                        poi: expect.objectContaining({
                            categoryIds: expect.arrayContaining([poiCategoriesToID['SPANISH_RESTAURANT']]),
                        }),
                    }),
                }),
                expect.objectContaining({
                    properties: expect.objectContaining({
                        poi: expect.objectContaining({
                            categoryIds: expect.arrayContaining([7315017]),
                        }),
                    }),
                }),
            ]),
        );
    });

    test('fuzzy search buildRequest hook modifies url', async () => {
        const query = 'cafe';
        const newQuery = 'parking';
        const res = await search(
            { query },
            {
                buildRequest: (params: FuzzySearchParams) => {
                    const req = buildFuzzySearchRequest(params);
                    req.pathname = req.pathname.replace(`${query}.json`, `${newQuery}.json`);
                    return req;
                },
            },
        );

        expect(res).toEqual(
            expect.objectContaining({
                type: 'FeatureCollection',
                features: expect.arrayContaining([
                    expect.objectContaining({
                        properties: expect.objectContaining({
                            poi: expect.objectContaining({
                                categories: expect.arrayContaining([
                                    expect.stringContaining(newQuery),
                                    expect.not.stringContaining(query),
                                ]),
                            }),
                        }),
                    }),
                ]),
            }),
        );
    });

    test('fuzzy search parseResponse hook modifies response', async () => {
        const query = 'cafe';
        const res = await search(
            { query },
            {
                parseResponse: (apiResponse: FuzzySearchResponseAPI) => {
                    const response = parseFuzzySearchResponse(apiResponse);
                    response.bbox = [0, 0, 0, 0];
                    return response;
                },
            },
        );

        expect(res).toEqual(
            expect.objectContaining({
                type: 'FeatureCollection',
                bbox: [0, 0, 0, 0],
            }),
        );
    });

    test('Fuzzy search with API request and response callbacks', async () => {
        const onAPIRequest = jest.fn() as (request: URL) => void;
        const onAPIResponse = jest.fn() as (request: URL, response: FuzzySearchResponseAPI) => void;
        const result = await search({ query: 'restaurant', onAPIRequest, onAPIResponse });
        expect(result).toBeDefined();
        expect(onAPIRequest).toHaveBeenCalledWith(expect.any(URL));
        expect(onAPIResponse).toHaveBeenCalledWith(expect.any(URL), expect.anything());
    });

    test('Fuzzy search with API request and error response callbacks', async () => {
        const onAPIRequest = jest.fn() as (request: URL) => void;
        const onAPIResponse = jest.fn() as (request: URL, response: FuzzySearchResponseAPI) => void;
        await expect(() =>
            search({ query: 'restaurant', maxFuzzyLevel: 999, validateRequest: false, onAPIRequest, onAPIResponse }),
        ).rejects.toThrow(expect.objectContaining({ status: 400 }));
        expect(onAPIRequest).toHaveBeenCalledWith(expect.any(URL));
        expect(onAPIResponse).toHaveBeenCalledWith(expect.any(URL), expect.objectContaining({ status: 400 }));
    });
});
