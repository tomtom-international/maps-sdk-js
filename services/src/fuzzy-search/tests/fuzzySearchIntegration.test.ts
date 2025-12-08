import type { Fuel, Place, POICategory, SearchPlaceProps } from '@tomtom-org/maps-sdk/core';
import { poiCategoriesToID } from '@tomtom-org/maps-sdk/core';
import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { search } from '../../search';
import type { SearchIndexType } from '../../shared';
import {
    baseSearchPlaceMandatoryProps,
    evStationBaseTestProps,
    expectPlaceTestFeature,
    putIntegrationTestsAPIKey,
} from '../../shared/tests/integrationTestUtils';
import { buildFuzzySearchRequest } from '../requestBuilder';
import { parseFuzzySearchResponse } from '../responseParser';
import type { FuzzySearchParams, FuzzySearchResponse, FuzzySearchResponseAPI } from '../types';

describe('Fuzzy Search service', () => {
    beforeAll(putIntegrationTestsAPIKey);

    beforeEach(async () => {
        // We enforce a delay before each test to avoid hitting the API rate limits.
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 2000));
    });

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
        const newQuery = 'restaurant';
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
                properties: expect.objectContaining({
                    query: newQuery,
                    totalResults: expect.any(Number),
                }),
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
        const onApiRequest = vi.fn() as (request: URL) => void;
        const onApiResponse = vi.fn() as (request: URL, response: FuzzySearchResponseAPI) => void;
        const result = await search({ query: 'restaurant', onAPIRequest: onApiRequest, onAPIResponse: onApiResponse });
        expect(result).toBeDefined();
        expect(onApiRequest).toHaveBeenCalledWith(expect.any(URL));
        expect(onApiResponse).toHaveBeenCalledWith(expect.any(URL), expect.anything());
    });

    test('Fuzzy search with API request and error response callbacks', async () => {
        const onApiRequest = vi.fn() as (request: URL) => void;
        const onApiResponse = vi.fn() as (request: URL, response: FuzzySearchResponseAPI) => void;
        await expect(() =>
            search({
                query: 'restaurant',
                maxFuzzyLevel: 999,
                validateRequest: false,
                onAPIRequest: onApiRequest,
                onAPIResponse: onApiResponse,
            }),
        ).rejects.toThrow(expect.objectContaining({ status: 400 }));
        expect(onApiRequest).toHaveBeenCalledWith(expect.any(URL));
        expect(onApiResponse).toHaveBeenCalledWith(expect.any(URL), expect.objectContaining({ status: 400 }));
    });
});
