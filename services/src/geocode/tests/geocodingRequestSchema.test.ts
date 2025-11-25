import type { Polygon } from 'geojson';
import { describe, expect, test } from 'vitest';
import { bestExecutionTimeMS } from '../../../../core/src/util/tests/performanceTestUtils';
import { geocodingReqObjects as geoCodingReqObjects } from '../../geocode/tests/requestBuilderPerf.data';
import { validateRequestSchema } from '../../shared/schema/validation';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { geocodingRequestSchema } from '../geocodingRequestSchema';
import type { GeocodingParams } from '../types/geocodingParams';

describe('Geocoding schema validation', () => {
    const apiKey = 'APIKEY';
    const commonBaseUrl = 'https://api-test.tomtom.com';

    test('it should fail when view is an invalid param', () => {
        const invalidParams: GeocodingParams = {
            query: 'amsterdam',
            //@ts-ignore
            view: 'MAA', // Invalid value, it should be of type View
            apiKey,
            commonBaseURL: commonBaseUrl,
        };

        expect(() => validateRequestSchema(invalidParams, { schema: geocodingRequestSchema })).toThrow(
            expect.objectContaining({
                message: expect.stringContaining('view'),
                issues: [
                    expect.objectContaining({
                        code: 'invalid_value',
                        values: ['Unified', 'AR', 'IN', 'PK', 'IL', 'MA', 'RU', 'TR', 'CN'],
                        path: ['view'],
                        message: 'Invalid input',
                    }),
                ],
            }),
        );
    });

    test('it should fail when limit is invalid', () => {
        const invalidParams: GeocodingParams = {
            query: 'amsterdam',
            typeahead: true,
            limit: 1500, // Invalid value, limit <= 100
            apiKey,
            commonBaseURL: commonBaseUrl,
        };

        expect(() => validateRequestSchema(invalidParams, { schema: geocodingRequestSchema })).toThrow(
            expect.objectContaining({
                message: expect.stringContaining('limit'),
                issues: [
                    expect.objectContaining({
                        code: 'too_big',
                        maximum: 100,
                        message: 'Invalid input',
                        path: ['limit'],
                    }),
                ],
            }),
        );
    });

    test('it should fail when offset is invalid', () => {
        const invalidParams: GeocodingParams = {
            query: 'amsterdam',
            offset: 1901, // Invalid value, offset <= 1900
            apiKey,
            commonBaseURL: commonBaseUrl,
        };
        expect(() => validateRequestSchema(invalidParams, { schema: geocodingRequestSchema })).toThrow(
            expect.objectContaining({
                message: expect.stringContaining('offset'),
                issues: [
                    expect.objectContaining({
                        code: 'too_big',
                        maximum: 1900,
                        message: 'Invalid input',
                        path: ['offset'],
                    }),
                ],
            }),
        );
    });

    test('it should fail when country format is invalid', () => {
        const invalidParams: GeocodingParams = {
            query: 'amsterdam',
            // @ts-ignore
            countries: 'NLD',
            apiKey,
            commonBaseURL: commonBaseUrl,
        };

        expect(() => validateRequestSchema(invalidParams, { schema: geocodingRequestSchema })).toThrow(
            expect.objectContaining({
                issues: [
                    expect.objectContaining({
                        code: 'invalid_type',
                        expected: 'array',
                        path: ['countries'],
                        message: 'Invalid input',
                    }),
                ],
            }),
        );
    });

    test('it should fail when query is missing in the request', () => {
        // @ts-ignore
        const invalidParams: GeocodingParams = {
            limit: 100,
            apiKey,
            commonBaseURL: commonBaseUrl,
        };
        expect(() => validateRequestSchema(invalidParams, { schema: geocodingRequestSchema })).toThrow(
            expect.objectContaining({
                issues: [
                    expect.objectContaining({
                        code: 'invalid_type',
                        expected: 'string',
                        path: ['query'],
                    }),
                ],
            }),
        );
    });

    test('it should fail when query is in an invalid format', () => {
        const invalidParams: GeocodingParams = {
            // @ts-ignore
            query: 33601,
            apiKey,
            commonBaseURL: commonBaseUrl,
        };

        expect(() => validateRequestSchema(invalidParams, { schema: geocodingRequestSchema })).toThrow(
            expect.objectContaining({
                issues: [
                    expect.objectContaining({
                        code: 'invalid_type',
                        expected: 'string',
                        message: 'Invalid input',
                        path: ['query'],
                    }),
                ],
            }),
        );
    });

    test('it should fail when radius is incorrect', () => {
        const invalidParams: GeocodingParams = {
            query: 'London',
            boundingBox: {
                type: 'Polygon',
                coordinates: [
                    [
                        [5.16905, 52.44009],
                        [5.16957, 52.44009],
                        [5.16957, 51.85925],
                        [5.16905, 51.85925],
                        [5.16905, 52.44009],
                    ],
                ],
            } as Polygon,
            // @ts-ignore
            radiusMeters: '1000',
            apiKey,
            commonBaseURL: commonBaseUrl,
        };
        expect(() => validateRequestSchema(invalidParams, { schema: geocodingRequestSchema })).toThrow(
            expect.objectContaining({
                issues: [
                    expect.objectContaining({
                        code: 'invalid_type',
                        expected: 'number',
                        message: 'Invalid input',
                        path: ['radiusMeters'],
                    }),
                ],
            }),
        );
    });

    test('it should fail when extendedPostalCodesFor format is incorrect', () => {
        const invalidParams: GeocodingParams = {
            query: 'London',
            // @ts-ignore
            extendedPostalCodesFor: 'Addr',
            apiKey,
            commonBaseURL: commonBaseUrl,
        };
        expect(() => validateRequestSchema(invalidParams, { schema: geocodingRequestSchema })).toThrow(
            expect.objectContaining({
                issues: [
                    expect.objectContaining({
                        code: 'invalid_type',
                        expected: 'array',
                        message: 'Invalid input',
                        path: ['extendedPostalCodesFor'],
                    }),
                ],
            }),
        );
    });

    test('it should fail when mapcode format is incorrect', () => {
        const invalidParams: GeocodingParams = {
            query: 'London',
            // @ts-ignore
            mapcodes: 'Local',
            apiKey,
            commonBaseURL: commonBaseUrl,
        };
        expect(() => validateRequestSchema(invalidParams, { schema: geocodingRequestSchema })).toThrow(
            expect.objectContaining({
                issues: [
                    expect.objectContaining({
                        code: 'invalid_type',
                        expected: 'array',
                        message: 'Invalid input',
                        path: ['mapcodes'],
                    }),
                ],
            }),
        );
    });

    test('it should fail when geographyTypes format is incorrect', () => {
        const invalidParams: GeocodingParams = {
            query: 'London',
            // @ts-ignore
            geographyTypes: 'Municipality',
            apiKey,
            commonBaseURL: commonBaseUrl,
        };
        expect(() => validateRequestSchema(invalidParams, { schema: geocodingRequestSchema })).toThrow(
            expect.objectContaining({
                issues: [
                    expect.objectContaining({
                        code: 'invalid_type',
                        expected: 'array',
                        message: 'Invalid input',
                        path: ['geographyTypes'],
                    }),
                ],
            }),
        );
    });

    test('it should fail when position lat/lon is out of range', () => {
        const invalidParams: GeocodingParams = {
            query: 'Minnesota',
            position: [46.6144, -93.1432], // Inverted coords for Minnesota
            apiKey,
            commonBaseURL: commonBaseUrl,
        };

        expect(() => validateRequestSchema(invalidParams, { schema: geocodingRequestSchema })).toThrow(
            expect.objectContaining({
                message: expect.stringContaining('Invalid input'),
                issues: expect.arrayContaining([
                    expect.objectContaining({
                        code: 'too_small',
                    }),
                ]),
            }),
        );
    });
});

describe('Geocoding request schema performance tests', () => {
    test('Geocoding request schema performance test', () => {
        expect(
            bestExecutionTimeMS(
                () => validateRequestSchema(geoCodingReqObjects as GeocodingParams, { schema: geocodingRequestSchema }),
                10,
            ),
        ).toBeLessThan(MAX_EXEC_TIMES_MS.geocoding.schemaValidation);
    });
});
