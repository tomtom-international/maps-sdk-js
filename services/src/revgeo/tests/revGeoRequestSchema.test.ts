import { describe, expect, test } from 'vitest';
import { bestExecutionTimeMS } from '../../../../core/src/util/tests/performanceTestUtils';
import revGeoReqObjects from '../../revgeo/tests/requestBuilderPerf.data.json';
import { validateRequestSchema } from '../../shared/schema/validation';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { revGeocodeRequestSchema } from '../revGeocodeRequestSchema';
import type { ReverseGeocodingParams } from '../types/reverseGeocodingParams';

describe('ReverseGeocoding schema validation', () => {
    const apiKey = 'APIKEY';
    const commonBaseUrl = 'https://api-test.tomtom.com';
    test('it should fail when position is an invalid param - case 1', () => {
        const invalidParams: ReverseGeocodingParams = {
            apiKey,
            commonBaseURL: commonBaseUrl,
            // @ts-ignore
            position: { lon: -122.420679, lat: 37.772537 },
        };
        expect(() => validateRequestSchema(invalidParams, { schema: revGeocodeRequestSchema })).toThrow(
            'Invalid input',
        );
    });

    test('it should fail when latitude/longitude is out of range', () => {
        expect(() =>
            validateRequestSchema(
                {
                    apiKey,
                    commonBaseURL: commonBaseUrl,
                    position: [200, -95],
                },
                { schema: revGeocodeRequestSchema },
            ),
        ).toThrow(
            expect.objectContaining({
                message: '✖ Invalid input\n' + '  → at position[0]\n' + '✖ Invalid input\n' + '  → at position[1]',
                issues: expect.arrayContaining([
                    expect.objectContaining({ code: 'too_big' }),
                    expect.objectContaining({ code: 'too_small' }),
                ]),
            }),
        );
    });

    test('it should fail when position is an invalid param - case 2', () => {
        const invalidParams: ReverseGeocodingParams = {
            apiKey,
            commonBaseURL: commonBaseUrl,
            // @ts-ignore
            position: (-122.420679, 37.772537),
        };

        expect(() => validateRequestSchema(invalidParams, { schema: revGeocodeRequestSchema })).toThrow(
            'Invalid input',
        );
    });

    test('it should fail when position is an invalid param - case 3', () => {
        const invalidParams: ReverseGeocodingParams = {
            apiKey,
            commonBaseURL: commonBaseUrl,
            // @ts-ignore
            position: '-122.420679, 37.772537',
        };

        expect(() => validateRequestSchema(invalidParams, { schema: revGeocodeRequestSchema })).toThrow(
            'Invalid input',
        );
    });

    test('it should fail when position is absent', () => {
        // @ts-ignore
        const invalidParams: ReverseGeocodingParams = {
            apiKey,
            commonBaseURL: commonBaseUrl,
            geographyType: ['Country'],
        };

        expect(() => validateRequestSchema(invalidParams, { schema: revGeocodeRequestSchema })).toThrow(
            'Invalid input',
        );
    });

    test("it should fail when heading isn't less than or equal to 360", () => {
        const invalidParams: ReverseGeocodingParams = {
            apiKey,
            commonBaseURL: commonBaseUrl,
            position: [-122.420679, 37.772537],
            // @ts-ignore
            heading: 361,
        };

        expect(() => validateRequestSchema(invalidParams, { schema: revGeocodeRequestSchema })).toThrow(
            expect.objectContaining({
                issues: [
                    {
                        code: 'too_big',
                        maximum: 360,
                        origin: 'number',
                        inclusive: true,
                        message: 'Invalid input',
                        path: ['heading'],
                    },
                ],
            }),
        );
    });

    test("it should fail when heading isn't in number format", () => {
        const invalidParams: ReverseGeocodingParams = {
            apiKey,
            commonBaseURL: commonBaseUrl,
            position: [-122.420679, 37.772537],
            // @ts-ignore
            heading: '180',
        };

        expect(() => validateRequestSchema(invalidParams, { schema: revGeocodeRequestSchema })).toThrow(
            expect.objectContaining({
                issues: [
                    {
                        code: 'invalid_type',
                        expected: 'number',
                        path: ['heading'],
                        message: 'Invalid input',
                    },
                ],
            }),
        );
    });

    test("it should fail when mapcode isn't of type string array", () => {
        const invalidParams: ReverseGeocodingParams = {
            apiKey,
            commonBaseURL: commonBaseUrl,
            position: [-122.420679, 37.772537],
            // @ts-ignore
            mapcodes: 'Local',
        };

        expect(() => validateRequestSchema(invalidParams, { schema: revGeocodeRequestSchema })).toThrow(
            expect.objectContaining({
                issues: [
                    {
                        code: 'invalid_type',
                        expected: 'array',
                        path: ['mapcodes'],
                        message: 'Invalid input',
                    },
                ],
            }),
        );
    });

    test("it should fail when param number isn't in string format", () => {
        const invalidParams: ReverseGeocodingParams = {
            apiKey,
            commonBaseURL: commonBaseUrl,
            position: [-122.420679, 37.772537],
            // @ts-ignore
            number: 36,
        };

        expect(() => validateRequestSchema(invalidParams, { schema: revGeocodeRequestSchema })).toThrow(
            expect.objectContaining({
                issues: [
                    {
                        code: 'invalid_type',
                        expected: 'string',
                        path: ['number'],
                        message: 'Invalid input',
                    },
                ],
            }),
        );
    });

    test("it should fail when param radius isn't in number format", () => {
        const invalidParams: ReverseGeocodingParams = {
            apiKey,
            commonBaseURL: commonBaseUrl,
            position: [-122.420679, 37.772537],
            // @ts-ignore
            radiusMeters: '2000',
        };

        expect(() => validateRequestSchema(invalidParams, { schema: revGeocodeRequestSchema })).toThrow(
            expect.objectContaining({
                issues: [
                    {
                        code: 'invalid_type',
                        expected: 'number',
                        path: ['radiusMeters'],
                        message: 'Invalid input',
                    },
                ],
            }),
        );
    });

    test("it should fail when param geography isn't a string array", () => {
        const invalidParams: ReverseGeocodingParams = {
            apiKey,
            commonBaseURL: commonBaseUrl,
            position: [-122.420679, 37.772537],
            // @ts-ignore
            geographyType: 'Country',
        };

        expect(() => validateRequestSchema(invalidParams, { schema: revGeocodeRequestSchema })).toThrow(
            expect.objectContaining({
                issues: [
                    {
                        code: 'invalid_type',
                        expected: 'array',
                        path: ['geographyType'],
                        message: 'Invalid input',
                    },
                ],
            }),
        );
    });

    test("it should fail when param returnRoadUse isn't of type string array", () => {
        const invalidParams: ReverseGeocodingParams = {
            apiKey,
            commonBaseURL: commonBaseUrl,
            position: [-122.420679, 37.772537],
            // @ts-ignore
            returnRoadUse: 'LimitedAccess',
        };

        expect(() => validateRequestSchema(invalidParams, { schema: revGeocodeRequestSchema })).toThrow(
            expect.objectContaining({
                issues: [
                    {
                        code: 'invalid_type',
                        expected: 'boolean',

                        path: ['returnRoadUse'],
                        message: 'Invalid input',
                    },
                ],
            }),
        );
    });

    test("it should fail when param allowFreeformNewline isn't of type boolean", () => {
        const invalidParams: ReverseGeocodingParams = {
            apiKey,
            commonBaseURL: commonBaseUrl,
            position: [-122.420679, 37.772537],
            // @ts-ignore
            allowFreeformNewline: 'true',
        };

        expect(() => validateRequestSchema(invalidParams, { schema: revGeocodeRequestSchema })).toThrow(
            expect.objectContaining({
                issues: [
                    {
                        code: 'invalid_type',
                        expected: 'boolean',

                        path: ['allowFreeformNewline'],
                        message: 'Invalid input',
                    },
                ],
            }),
        );
    });

    test("it should fail when param returnSpeedLimit isn't of type boolean", () => {
        const invalidParams: ReverseGeocodingParams = {
            apiKey,
            commonBaseURL: commonBaseUrl,
            position: [-122.420679, 37.772537],
            // @ts-ignore
            returnSpeedLimit: 'true',
        };

        expect(() => validateRequestSchema(invalidParams, { schema: revGeocodeRequestSchema })).toThrow(
            expect.objectContaining({
                issues: [
                    {
                        code: 'invalid_type',
                        expected: 'boolean',

                        path: ['returnSpeedLimit'],
                        message: 'Invalid input',
                    },
                ],
            }),
        );
    });

    test("it should fail when param returnMatchType isn't of type boolean", () => {
        const invalidParams: ReverseGeocodingParams = {
            apiKey,
            commonBaseURL: commonBaseUrl,
            position: [-122.420679, 37.772537],
            // @ts-ignore
            returnMatchType: 'true',
        };

        expect(() => validateRequestSchema(invalidParams, { schema: revGeocodeRequestSchema })).toThrow(
            expect.objectContaining({
                issues: [
                    {
                        code: 'invalid_type',
                        expected: 'boolean',

                        path: ['returnMatchType'],
                        message: 'Invalid input',
                    },
                ],
            }),
        );
    });

    test('it should fail when view is an invalid param', () => {
        const invalidParams: ReverseGeocodingParams = {
            apiKey,
            commonBaseURL: commonBaseUrl,
            position: [-122.420679, 37.772537],
            //@ts-ignore
            view: 'MAA',
        };

        expect(() => validateRequestSchema(invalidParams, { schema: revGeocodeRequestSchema })).toThrow(
            expect.objectContaining({
                issues: [
                    {
                        code: 'invalid_value',
                        values: ['Unified', 'AR', 'IN', 'PK', 'IL', 'MA', 'RU', 'TR', 'CN'],
                        path: ['view'],
                        message: 'Invalid input',
                    },
                ],
            }),
        );
    });
});

describe('Rev-Geo request schema performance tests', () => {
    test.each(revGeoReqObjects)("'%s'", (_title: string, params: ReverseGeocodingParams) => {
        // @ts-ignore
        expect(
            bestExecutionTimeMS(() => validateRequestSchema(params, { schema: revGeocodeRequestSchema }), 10),
        ).toBeLessThan(MAX_EXEC_TIMES_MS.revGeo.schemaValidation);
    });
});
