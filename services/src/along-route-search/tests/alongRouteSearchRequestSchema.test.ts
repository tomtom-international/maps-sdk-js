import { describe, expect, test } from 'vitest';
import { bestExecutionTimeMS } from '../../../../core/src/util/tests/performanceTestUtils';
import { validateRequestSchema } from '../../shared/schema/validation';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { alongRouteSearchRequestSchema } from '../alongRouteSearchRequestSchema';
import type { AlongRouteSearchParams } from '../types';
import { alongRouteSearchReqObject } from './requestBuilderPerf.data';

describe('AlongRouteSearch Schema Validation', () => {
    const config = { schema: alongRouteSearchRequestSchema };
    const apiKey = 'APIKEY';
    const commonBaseURL = 'https://api-test.tomtom.com';

    const route = {
        type: 'LineString' as const,
        coordinates: [
            [4.9, 52.37],
            [2.35, 48.85],
        ] as [number, number][],
    };

    test('it should pass with required parameters only', () => {
        expect(
            validateRequestSchema<AlongRouteSearchParams>(
                { apiKey, commonBaseURL, route, maxDetourTimeSeconds: 300 },
                config,
            ),
        ).toMatchObject({ maxDetourTimeSeconds: 300 });
    });

    test('it should pass with all optional parameters', () => {
        expect(
            validateRequestSchema<AlongRouteSearchParams>(
                {
                    apiKey,
                    commonBaseURL,
                    route,
                    maxDetourTimeSeconds: 600,
                    query: 'coffee',
                    sortBy: 'detourOffset',
                    limit: 20,
                    language: 'en-GB',
                    poiCategories: ['ELECTRIC_VEHICLE_STATION'],
                },
                config,
            ),
        ).toMatchObject({ maxDetourTimeSeconds: 600, sortBy: 'detourOffset' });
    });

    test('it should pass with sortBy detourTime', () => {
        expect(
            validateRequestSchema<AlongRouteSearchParams>(
                { apiKey, commonBaseURL, route, maxDetourTimeSeconds: 300, sortBy: 'detourTime' },
                config,
            ),
        ).toMatchObject({ sortBy: 'detourTime' });
    });

    test('it should fail when route is missing', () => {
        expect(() => validateRequestSchema({ apiKey, commonBaseURL, maxDetourTimeSeconds: 300 }, config)).toThrow(
            'Invalid input',
        );
    });

    test('it should fail when maxDetourTimeSeconds is missing', () => {
        expect(() => validateRequestSchema({ apiKey, commonBaseURL, route }, config)).toThrow('Invalid input');
    });

    test('it should fail when maxDetourTimeSeconds is not a positive integer', () => {
        expect(() => validateRequestSchema({ apiKey, commonBaseURL, route, maxDetourTimeSeconds: -1 }, config)).toThrow(
            expect.objectContaining({
                issues: [
                    expect.objectContaining({
                        code: 'too_small',
                        path: ['maxDetourTimeSeconds'],
                    }),
                ],
            }),
        );
    });

    test('it should fail when maxDetourTimeSeconds is zero', () => {
        expect(() => validateRequestSchema({ apiKey, commonBaseURL, route, maxDetourTimeSeconds: 0 }, config)).toThrow(
            expect.objectContaining({
                issues: [
                    expect.objectContaining({
                        code: 'too_small',
                        path: ['maxDetourTimeSeconds'],
                    }),
                ],
            }),
        );
    });

    test('it should fail when maxDetourTimeSeconds is not an integer', () => {
        expect(() =>
            validateRequestSchema({ apiKey, commonBaseURL, route, maxDetourTimeSeconds: 300.5 }, config),
        ).toThrow(
            expect.objectContaining({
                issues: [
                    expect.objectContaining({
                        path: ['maxDetourTimeSeconds'],
                    }),
                ],
            }),
        );
    });

    test('it should fail when sortBy has an invalid value', () => {
        expect(() =>
            validateRequestSchema(
                { apiKey, commonBaseURL, route, maxDetourTimeSeconds: 300, sortBy: 'invalid' },
                config,
            ),
        ).toThrow(
            expect.objectContaining({
                issues: [
                    expect.objectContaining({
                        code: 'invalid_value',
                        path: ['sortBy'],
                    }),
                ],
            }),
        );
    });

    test('it should pass with a Route Feature input', () => {
        expect(
            validateRequestSchema<AlongRouteSearchParams>(
                {
                    apiKey,
                    commonBaseURL,
                    route: {
                        type: 'Feature',
                        id: 'route-0',
                        bbox: [2.35, 48.85, 4.9, 52.37],
                        geometry: route,
                        properties: {} as never,
                    },
                    maxDetourTimeSeconds: 300,
                },
                config,
            ),
        ).toMatchObject({ maxDetourTimeSeconds: 300 });
    });

    test('it should pass with a Position[] route input', () => {
        expect(
            validateRequestSchema<AlongRouteSearchParams>(
                {
                    apiKey,
                    commonBaseURL,
                    route: [
                        [4.9, 52.37],
                        [2.35, 48.85],
                    ],
                    maxDetourTimeSeconds: 300,
                },
                config,
            ),
        ).toMatchObject({ maxDetourTimeSeconds: 300 });
    });

    test('it should fail when route is not a LineString, Feature, or Position[]', () => {
        expect(() =>
            validateRequestSchema(
                {
                    apiKey,
                    commonBaseURL,
                    route: { type: 'Point', coordinates: [4.9, 52.37] },
                    maxDetourTimeSeconds: 300,
                },
                config,
            ),
        ).toThrow('Invalid input');
    });

    test('it should fail when POI categories contain invalid enum values', () => {
        expect(() =>
            validateRequestSchema(
                {
                    apiKey,
                    commonBaseURL,
                    route,
                    maxDetourTimeSeconds: 300,
                    poiCategories: ['INVALID_CATEGORY'],
                },
                config,
            ),
        ).toThrow(
            expect.objectContaining({
                issues: [
                    expect.objectContaining({
                        code: 'invalid_value',
                        path: ['poiCategories', 0],
                    }),
                ],
            }),
        );
    });
});

describe('AlongRouteSearch request schema performance tests', () => {
    test('AlongRouteSearch request schema performance test', () => {
        expect(
            bestExecutionTimeMS(
                () =>
                    validateRequestSchema(alongRouteSearchReqObject, {
                        schema: alongRouteSearchRequestSchema,
                    }),
                10,
            ),
        ).toBeLessThan(MAX_EXEC_TIMES_MS.search.alongRouteSearch.schemaValidation);
    });
});
