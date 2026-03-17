import type { Place, SearchPlaceProps } from '@tomtom-org/maps-sdk/core';
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import type { LineString } from 'geojson';
import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { search } from '../../search';
import {
    basePOITestProps,
    evStationBaseTestProps,
    expectPlaceTestFeature,
} from '../../shared/tests/integrationTestUtils';
import { buildAlongRouteSearchRequest } from '../requestBuilder';
import { parseAlongRouteSearchResponse } from '../responseParser';
import type {
    AlongRouteSearchParams,
    AlongRouteSearchRequestAPI,
    AlongRouteSearchResponse,
    AlongRouteSearchResponseAPI,
} from '../types';

// Amsterdam → Utrecht route (simplified)
const route: LineString = {
    type: 'LineString',
    coordinates: [
        [4.9, 52.37], // Amsterdam
        [4.95, 52.28],
        [5.0, 52.15],
        [5.1, 52.09], // Utrecht
    ],
};

describe('Along Route Search service', () => {
    beforeAll(() => TomTomConfig.instance.put({ apiKey: process.env.API_KEY_TESTS }));

    beforeEach(async () => {
        // We enforce a delay before each test to avoid hitting the API rate limits.
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 2000));
    });

    const expectWorkingResult = () =>
        expect.objectContaining<AlongRouteSearchResponse>({
            type: 'FeatureCollection',
            features: expect.arrayContaining<Place<SearchPlaceProps>>([expectPlaceTestFeature(basePOITestProps)]),
        });

    test('alongRouteSearch works with query', async () => {
        const res = await search({
            route,
            maxDetourTimeSeconds: 600,
            query: 'cafe',
            limit: 5,
            language: 'en-GB',
        });

        expect(res.features.length).toBeGreaterThan(0);
        expect(res).toEqual(expectWorkingResult());
    });

    test('alongRouteSearch with EV charging stations', async () => {
        const evStations = await search({
            route,
            maxDetourTimeSeconds: 600,
            poiCategories: ['ELECTRIC_VEHICLE_STATION'],
            limit: 5,
        });
        expect(evStations.features).toEqual(expect.arrayContaining([expectPlaceTestFeature(evStationBaseTestProps)]));
    });

    test('alongRouteSearch with sortBy detourOffset', async () => {
        const res = await search({
            route,
            maxDetourTimeSeconds: 600,
            query: 'restaurant',
            sortBy: 'detourOffset',
            limit: 5,
        });
        expect(res.features.length).toBeGreaterThan(0);
    });

    test('alongRouteSearch with Position[] route input', async () => {
        const positions = route.coordinates as [number, number][];
        const res = await search({
            route: positions,
            maxDetourTimeSeconds: 600,
            query: 'cafe',
            limit: 5,
        });
        expect(res.features.length).toBeGreaterThan(0);
    });

    test('alongRouteSearch with Route Feature input', async () => {
        const routeFeature: AlongRouteSearchParams['route'] = {
            type: 'Feature',
            id: 'route-0',
            bbox: [4.9, 52.09, 5.1, 52.37],
            geometry: route as { type: 'LineString'; coordinates: number[][] },
            properties: {} as never,
        };
        const res = await search({
            route: routeFeature,
            maxDetourTimeSeconds: 600,
            query: 'cafe',
            limit: 5,
        });
        expect(res.features.length).toBeGreaterThan(0);
    });

    test('alongRouteSearch buildRequest hook modifies url', async () => {
        const query = 'cafe';
        const newQuery = 'hotel';
        const res = await search(
            { route, maxDetourTimeSeconds: 600, query },
            {
                buildRequest: (params: AlongRouteSearchParams) => {
                    const req = buildAlongRouteSearchRequest(params);
                    req.url.pathname = req.url.pathname.replace(`${query}.json`, `${newQuery}.json`);
                    return req;
                },
            },
        );

        expect(res).toEqual(
            expect.objectContaining({
                type: 'FeatureCollection',
                features: expect.any(Array),
            }),
        );
    });

    test('alongRouteSearch parseResponse hook modifies response', async () => {
        const res = await search(
            { route, maxDetourTimeSeconds: 600, query: 'cafe' },
            {
                parseResponse: (apiResponse: AlongRouteSearchResponseAPI) => {
                    const response = parseAlongRouteSearchResponse(apiResponse);
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

    test('alongRouteSearch with API request and response callbacks', async () => {
        const onApiRequest = vi.fn() as (request: AlongRouteSearchRequestAPI) => void;
        const onApiResponse = vi.fn() as (
            request: AlongRouteSearchRequestAPI,
            response: AlongRouteSearchResponseAPI,
        ) => void;

        const result = await search({
            route,
            maxDetourTimeSeconds: 600,
            query: 'cafe',
            onAPIRequest: onApiRequest,
            onAPIResponse: onApiResponse,
        });

        expect(result).toBeDefined();
        const expectedApiRequest = { url: expect.any(URL), data: expect.anything() };
        expect(onApiRequest).toHaveBeenCalledWith(expectedApiRequest);
        expect(onApiResponse).toHaveBeenCalledWith(expectedApiRequest, expect.anything());
    });

    test('alongRouteSearch with API request and error response callbacks', async () => {
        const onApiRequest = vi.fn() as (request: AlongRouteSearchRequestAPI) => void;
        const onApiResponse = vi.fn() as (
            request: AlongRouteSearchRequestAPI,
            response: AlongRouteSearchResponseAPI,
        ) => void;

        await expect(() =>
            search({
                route,
                maxDetourTimeSeconds: -1,
                validateRequest: false,
                onAPIRequest: onApiRequest,
                onAPIResponse: onApiResponse,
            }),
        ).rejects.toThrow(expect.objectContaining({ status: 400 }));

        const expectedApiRequest = { url: expect.any(URL), data: expect.anything() };
        expect(onApiRequest).toHaveBeenCalledWith(expectedApiRequest);
        expect(onApiResponse).toHaveBeenCalledWith(expectedApiRequest, expect.objectContaining({ status: 400 }));
    });
});
