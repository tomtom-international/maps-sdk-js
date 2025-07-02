import type { GeocodingParams } from '../types/geocodingParams';
import type { Polygon } from 'geojson';
import geoCodingReqObjects from '../../geocode/tests/requestBuilderPerf.data.json';
import { bestExecutionTimeMS } from 'core/src/util/tests/performanceTestUtils';
import { validateRequestSchema } from '../../shared/validation';
import { geocodingRequestSchema } from '../geocodingRequestSchema';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';

describe('Geocoding schema validation', () => {
    const apiKey = 'APIKEY';
    const commonBaseURL = 'https://api-test.tomtom.com';

    test('it should fail when view is an invalid param', () => {
        const invalidParams: GeocodingParams = {
            query: 'amsterdam',
            //@ts-ignore
            view: 'MAA', // Invalid value, it should be of type View
            apiKey,
            commonBaseURL,
        };

        expect(() => validateRequestSchema(invalidParams, { schema: geocodingRequestSchema })).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        received: 'MAA',
                        code: 'invalid_enum_value',
                        options: ['Unified', 'AR', 'IN', 'PK', 'IL', 'MA', 'RU', 'TR', 'CN'],
                        path: ['view'],
                        message:
                            'Invalid enum value. ' +
                            "Expected 'Unified' | 'AR' | 'IN' | 'PK' | 'IL' | 'MA' | 'RU' | 'TR' | 'CN', received 'MAA'",
                    },
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
            commonBaseURL,
        };
        expect(() => validateRequestSchema(invalidParams, { schema: geocodingRequestSchema })).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: 'too_big',
                        maximum: 100,
                        type: 'number',
                        inclusive: true,
                        exact: false,
                        message: 'Number must be less than or equal to 100',
                        path: ['limit'],
                    },
                ],
            }),
        );
    });

    test('it should fail when offset is invalid', () => {
        const invalidParams: GeocodingParams = {
            query: 'amsterdam',
            offset: 1901, // Invalid value, offset <= 1900
            apiKey,
            commonBaseURL,
        };
        expect(() => validateRequestSchema(invalidParams, { schema: geocodingRequestSchema })).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: 'too_big',
                        maximum: 1900,
                        type: 'number',
                        inclusive: true,
                        exact: false,
                        message: 'Number must be less than or equal to 1900',
                        path: ['offset'],
                    },
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
            commonBaseURL,
        };
        expect(() => validateRequestSchema(invalidParams, { schema: geocodingRequestSchema })).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: 'invalid_type',
                        expected: 'array',
                        received: 'string',
                        path: ['countries'],
                        message: 'Expected array, received string',
                    },
                ],
            }),
        );
    });

    test('it should fail when query is missing in the request', () => {
        // @ts-ignore
        const invalidParams: GeocodingParams = {
            limit: 100,
            apiKey,
            commonBaseURL,
        };
        expect(() => validateRequestSchema(invalidParams, { schema: geocodingRequestSchema })).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: 'invalid_type',
                        expected: 'string',
                        received: 'undefined',
                        message: 'Required',
                        path: ['query'],
                    },
                ],
            }),
        );
    });

    test('it should fail when query is in an invalid format', () => {
        const invalidParams: GeocodingParams = {
            // @ts-ignore
            query: 33601,
            apiKey,
            commonBaseURL,
        };
        expect(() => validateRequestSchema(invalidParams, { schema: geocodingRequestSchema })).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: 'invalid_type',
                        expected: 'string',
                        received: 'number',
                        message: 'Expected string, received number',
                        path: ['query'],
                    },
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
            commonBaseURL,
        };
        expect(() => validateRequestSchema(invalidParams, { schema: geocodingRequestSchema })).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: 'invalid_type',
                        expected: 'number',
                        received: 'string',
                        message: 'Expected number, received string',
                        path: ['radiusMeters'],
                    },
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
            commonBaseURL,
        };
        expect(() => validateRequestSchema(invalidParams, { schema: geocodingRequestSchema })).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: 'invalid_type',
                        expected: 'array',
                        received: 'string',
                        message: 'Expected array, received string',
                        path: ['extendedPostalCodesFor'],
                    },
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
            commonBaseURL,
        };
        expect(() => validateRequestSchema(invalidParams, { schema: geocodingRequestSchema })).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: 'invalid_type',
                        expected: 'array',
                        received: 'string',
                        message: 'Expected array, received string',
                        path: ['mapcodes'],
                    },
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
            commonBaseURL,
        };
        expect(() => validateRequestSchema(invalidParams, { schema: geocodingRequestSchema })).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: 'invalid_type',
                        expected: 'array',
                        received: 'string',
                        message: 'Expected array, received string',
                        path: ['geographyTypes'],
                    },
                ],
            }),
        );
    });

    test('it should fail when position lat/lon is out of range', () => {
        const invalidParams: GeocodingParams = {
            query: 'Minnesota',
            position: [46.6144, -93.1432], //Inverted coords for Minnesota
            apiKey,
            commonBaseURL,
        };
        expect(() => validateRequestSchema(invalidParams, { schema: geocodingRequestSchema })).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: 'too_small',
                        minimum: -90,
                        type: 'number',
                        inclusive: true,
                        exact: false,
                        message: 'Number must be greater than or equal to -90',
                        path: ['position', 1],
                    },
                ],
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
