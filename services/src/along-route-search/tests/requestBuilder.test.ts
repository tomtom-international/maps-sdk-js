import { describe, expect, test } from 'vitest';
import { bestExecutionTimeMS } from '../../../../core/src/util/tests/performanceTestUtils';
import type { PostObject } from '../../shared';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { buildAlongRouteSearchRequest } from '../requestBuilder';
import type { AlongRouteSearchParams, AlongRouteSearchPayloadAPI } from '../types';
import requestBuilderData from './requestBuilder.data';
import { alongRouteSearchReqObject } from './requestBuilderPerf.data';

describe('Along Route Search request URL building tests', () => {
    test.each(
        requestBuilderData,
    )("'%s'", (_name: string, params: AlongRouteSearchParams, requestData: PostObject<AlongRouteSearchPayloadAPI>) => {
        expect(JSON.parse(JSON.stringify(buildAlongRouteSearchRequest(params)))).toMatchObject(
            JSON.parse(JSON.stringify(requestData)),
        );
    });

    test('Route Feature input produces same points as bare LineString', () => {
        const lineString: AlongRouteSearchParams = {
            apiKey: 'KEY',
            commonBaseURL: 'https://api.tomtom.com',
            route: {
                type: 'LineString',
                coordinates: [
                    [4.9, 52.37],
                    [2.35, 48.85],
                ],
            },
            maxDetourTimeSeconds: 300,
        };
        const routeFeature: AlongRouteSearchParams = {
            ...lineString,
            route: {
                type: 'Feature',
                id: 'route-0',
                bbox: [2.35, 48.85, 4.9, 52.37],
                geometry: {
                    type: 'LineString',
                    coordinates: [
                        [4.9, 52.37],
                        [2.35, 48.85],
                    ],
                },
                properties: {} as never,
            },
        };

        const lineStringReq = buildAlongRouteSearchRequest(lineString);
        const featureReq = buildAlongRouteSearchRequest(routeFeature);
        expect(lineStringReq.data).toEqual(featureReq.data);
    });

    test('Coordinates are correctly converted to lat/lon (lon-lat input → lat/lon output)', () => {
        const req = buildAlongRouteSearchRequest({
            apiKey: 'KEY',
            commonBaseURL: 'https://api.tomtom.com',
            route: {
                type: 'LineString',
                coordinates: [
                    [4.9, 52.37], // [lon, lat]
                    [2.35, 48.85],
                ],
            },
            maxDetourTimeSeconds: 300,
        });
        expect(req.data?.route.points[0]).toEqual({ lat: 52.37, lon: 4.9 });
        expect(req.data?.route.points[1]).toEqual({ lat: 48.85, lon: 2.35 });
    });

    test('maxDetourTimeSeconds is appended as maxDetourTime query param', () => {
        const req = buildAlongRouteSearchRequest({
            apiKey: 'KEY',
            commonBaseURL: 'https://api.tomtom.com',
            route: {
                type: 'LineString',
                coordinates: [
                    [4.9, 52.37],
                    [2.35, 48.85],
                ],
            },
            maxDetourTimeSeconds: 450,
        });
        expect(req.url.searchParams.get('maxDetourTime')).toBe('450');
    });
});

describe('Along Route Search request URL builder performance tests', () => {
    test('Along Route Search request URL builder performance test', () => {
        expect(bestExecutionTimeMS(() => buildAlongRouteSearchRequest(alongRouteSearchReqObject), 10)).toBeLessThan(
            MAX_EXEC_TIMES_MS.search.alongRouteSearch.requestBuilding,
        );
    });
});
