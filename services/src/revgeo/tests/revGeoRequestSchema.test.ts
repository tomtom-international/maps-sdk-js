import { bestExecutionTimeMS } from 'core/src/util/tests/performanceTestUtils';
import revGeoReqObjects from '../../revgeo/tests/requestBuilderPerf.data.json';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { validateRequestSchema } from '../../shared/validation';
import { revGeocodeRequestSchema } from '../revGeocodeRequestSchema';
import type { ReverseGeocodingParams } from '../types/reverseGeocodingParams';

describe('ReverseGeocoding schema validation', () => {
    const apiKey = 'APIKEY';
    const commonBaseURL = 'https://api-test.tomtom.com';
    test('it should fail when position is an invalid param - case 1', () => {
        const invalidParams: ReverseGeocodingParams = {
            apiKey,
            commonBaseURL,
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
                    commonBaseURL,
                    position: [200, -95],
                },
                { schema: revGeocodeRequestSchema },
            ),
        ).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: 'too_big',
                        maximum: 180,
                        type: 'number',
                        inclusive: true,
                        exact: false,
                        message: 'Number must be less than or equal to 180',
                        path: ['position', 0],
                    },
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

    test('it should fail when position is an invalid param - case 2', () => {
        const invalidParams: ReverseGeocodingParams = {
            apiKey,
            commonBaseURL,
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
            commonBaseURL,
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
            commonBaseURL,
            geographyType: ['Country'],
        };

        expect(() => validateRequestSchema(invalidParams, { schema: revGeocodeRequestSchema })).toThrow(
            'Invalid input',
        );
    });

    test("it should fail when heading isn't less than or equal to 360", () => {
        const invalidParams: ReverseGeocodingParams = {
            apiKey,
            commonBaseURL,
            position: [-122.420679, 37.772537],
            // @ts-ignore
            heading: 361,
        };

        expect(() => validateRequestSchema(invalidParams, { schema: revGeocodeRequestSchema })).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: 'too_big',
                        maximum: 360,
                        type: 'number',
                        inclusive: true,
                        exact: false,
                        message: 'Number must be less than or equal to 360',
                        path: ['heading'],
                    },
                ],
            }),
        );
    });

    test("it should fail when heading isn't in number format", () => {
        const invalidParams: ReverseGeocodingParams = {
            apiKey,
            commonBaseURL,
            position: [-122.420679, 37.772537],
            // @ts-ignore
            heading: '180',
        };

        expect(() => validateRequestSchema(invalidParams, { schema: revGeocodeRequestSchema })).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: 'invalid_type',
                        expected: 'number',
                        received: 'string',
                        path: ['heading'],
                        message: 'Expected number, received string',
                    },
                ],
            }),
        );
    });

    test("it should fail when mapcode isn't of type string array", () => {
        const invalidParams: ReverseGeocodingParams = {
            apiKey,
            commonBaseURL,
            position: [-122.420679, 37.772537],
            // @ts-ignore
            mapcodes: 'Local',
        };

        expect(() => validateRequestSchema(invalidParams, { schema: revGeocodeRequestSchema })).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: 'invalid_type',
                        expected: 'array',
                        received: 'string',
                        path: ['mapcodes'],
                        message: 'Expected array, received string',
                    },
                ],
            }),
        );
    });

    test("it should fail when param number isn't in string format", () => {
        const invalidParams: ReverseGeocodingParams = {
            apiKey,
            commonBaseURL,
            position: [-122.420679, 37.772537],
            // @ts-ignore
            number: 36,
        };

        expect(() => validateRequestSchema(invalidParams, { schema: revGeocodeRequestSchema })).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: 'invalid_type',
                        expected: 'string',
                        received: 'number',
                        path: ['number'],
                        message: 'Expected string, received number',
                    },
                ],
            }),
        );
    });

    test("it should fail when param radius isn't in number format", () => {
        const invalidParams: ReverseGeocodingParams = {
            apiKey,
            commonBaseURL,
            position: [-122.420679, 37.772537],
            // @ts-ignore
            radiusMeters: '2000',
        };

        expect(() => validateRequestSchema(invalidParams, { schema: revGeocodeRequestSchema })).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: 'invalid_type',
                        expected: 'number',
                        received: 'string',
                        path: ['radiusMeters'],
                        message: 'Expected number, received string',
                    },
                ],
            }),
        );
    });

    test("it should fail when param geography isn't a string array", () => {
        const invalidParams: ReverseGeocodingParams = {
            apiKey,
            commonBaseURL,
            position: [-122.420679, 37.772537],
            // @ts-ignore
            geographyType: 'Country',
        };

        expect(() => validateRequestSchema(invalidParams, { schema: revGeocodeRequestSchema })).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: 'invalid_type',
                        expected: 'array',
                        received: 'string',
                        path: ['geographyType'],
                        message: 'Expected array, received string',
                    },
                ],
            }),
        );
    });

    test("it should fail when param returnRoadUse isn't of type string array", () => {
        const invalidParams: ReverseGeocodingParams = {
            apiKey,
            commonBaseURL,
            position: [-122.420679, 37.772537],
            // @ts-ignore
            returnRoadUse: 'LimitedAccess',
        };

        expect(() => validateRequestSchema(invalidParams, { schema: revGeocodeRequestSchema })).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: 'invalid_type',
                        expected: 'boolean',
                        received: 'string',
                        path: ['returnRoadUse'],
                        message: 'Expected boolean, received string',
                    },
                ],
            }),
        );
    });

    test("it should fail when param allowFreeformNewline isn't of type boolean", () => {
        const invalidParams: ReverseGeocodingParams = {
            apiKey,
            commonBaseURL,
            position: [-122.420679, 37.772537],
            // @ts-ignore
            allowFreeformNewline: 'true',
        };

        expect(() => validateRequestSchema(invalidParams, { schema: revGeocodeRequestSchema })).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: 'invalid_type',
                        expected: 'boolean',
                        received: 'string',
                        path: ['allowFreeformNewline'],
                        message: 'Expected boolean, received string',
                    },
                ],
            }),
        );
    });

    test("it should fail when param returnSpeedLimit isn't of type boolean", () => {
        const invalidParams: ReverseGeocodingParams = {
            apiKey,
            commonBaseURL,
            position: [-122.420679, 37.772537],
            // @ts-ignore
            returnSpeedLimit: 'true',
        };

        expect(() => validateRequestSchema(invalidParams, { schema: revGeocodeRequestSchema })).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: 'invalid_type',
                        expected: 'boolean',
                        received: 'string',
                        path: ['returnSpeedLimit'],
                        message: 'Expected boolean, received string',
                    },
                ],
            }),
        );
    });

    test("it should fail when param returnMatchType isn't of type boolean", () => {
        const invalidParams: ReverseGeocodingParams = {
            apiKey,
            commonBaseURL,
            position: [-122.420679, 37.772537],
            // @ts-ignore
            returnMatchType: 'true',
        };

        expect(() => validateRequestSchema(invalidParams, { schema: revGeocodeRequestSchema })).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: 'invalid_type',
                        expected: 'boolean',
                        received: 'string',
                        path: ['returnMatchType'],
                        message: 'Expected boolean, received string',
                    },
                ],
            }),
        );
    });

    test('it should fail when view is an invalid param', () => {
        const invalidParams: ReverseGeocodingParams = {
            apiKey,
            commonBaseURL,
            position: [-122.420679, 37.772537],
            //@ts-ignore
            view: 'MAA',
        };

        expect(() => validateRequestSchema(invalidParams, { schema: revGeocodeRequestSchema })).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        received: 'MAA',
                        code: 'invalid_enum_value',
                        options: ['Unified', 'AR', 'IN', 'PK', 'IL', 'MA', 'RU', 'TR', 'CN'],
                        path: ['view'],
                        message:
                            "Invalid enum value. Expected 'Unified' | " +
                            "'AR' | 'IN' | 'PK' | 'IL' | 'MA' | 'RU' | 'TR' | 'CN', received 'MAA'",
                    },
                ],
            }),
        );
    });
});

describe('Rev-Geo request schema performance tests', () => {
    test.each(revGeoReqObjects)(
        "'%s'",
        // @ts-ignore
        (_title: string, params: ReverseGeocodingParams) => {
            expect(
                bestExecutionTimeMS(() => validateRequestSchema(params, { schema: revGeocodeRequestSchema }), 10),
            ).toBeLessThan(MAX_EXEC_TIMES_MS.revGeo.schemaValidation);
        },
    );
});
