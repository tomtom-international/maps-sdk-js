import { bestExecutionTimeMS } from 'core/src/util/tests/performanceTestUtils';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { validateRequestSchema } from '../../shared/validation';
import { fuzzySearchRequestSchema } from '../fuzzySearchRequestSchema';
import type { FuzzySearchParams } from '../types';
import fuzzySearchReqObjects from './requestBuilderPerf.data.json';

describe('FuzzySearch Schema Validation', () => {
    const apiKey = 'API_KEY';
    const query = 'restaurant';

    test('it should pass when poi category is of type array consisting poi category IDs', () => {
        expect(
            fuzzySearchRequestSchema.parse({
                query,
                poiCategories: [7315, 7315081],
            }),
        ).toMatchObject({ query: 'restaurant', poiCategories: [7315, 7315081] });
    });

    test('it should pass when poi category is of type array consisting human readable category names', () => {
        expect(
            fuzzySearchRequestSchema.parse({
                query,
                poiCategories: ['ITALIAN_RESTAURANT', 'FRENCH_RESTAURANT'],
            }),
        ).toMatchObject({ query: 'restaurant', poiCategories: ['ITALIAN_RESTAURANT', 'FRENCH_RESTAURANT'] });
    });

    test('it should fail when missing mandatory query', () => {
        expect(() => validateRequestSchema({ apiKey, limit: 10 }, { schema: fuzzySearchRequestSchema })).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: 'invalid_type',
                        expected: 'string',
                        received: 'undefined',
                        path: ['query'],
                        message: 'Required',
                    },
                ],
            }),
        );
    });

    test('it should fail when query is not of type string', () => {
        expect(() => validateRequestSchema({ apiKey, query: undefined }, { schema: fuzzySearchRequestSchema })).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: 'invalid_type',
                        expected: 'string',
                        received: 'undefined',
                        path: ['query'],
                        message: 'Required',
                    },
                ],
            }),
        );
    });

    test('it should fail when max and min fuzzy levels are beyond boundaries', () => {
        expect(() =>
            validateRequestSchema(
                { apiKey, query, minFuzzyLevel: -1, maxFuzzyLevel: 999 },
                { schema: fuzzySearchRequestSchema },
            ),
        ).toThrow(
            expect.objectContaining({
                errors: expect.arrayContaining([
                    expect.objectContaining({
                        path: ['minFuzzyLevel'],
                        message: 'Number must be greater than or equal to 1',
                    }),
                    expect.objectContaining({
                        path: ['maxFuzzyLevel'],
                        message: 'Number must be less than or equal to 4',
                    }),
                ]),
            }),
        );
    });

    test('it should fail when typeahead has wrong value', () => {
        expect(() =>
            validateRequestSchema({ apiKey, query, typeahead: 1 }, { schema: fuzzySearchRequestSchema }),
        ).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: 'invalid_type',
                        expected: 'boolean',
                        received: 'number',
                        path: ['typeahead'],
                        message: 'Expected boolean, received number',
                    },
                ],
            }),
        );
    });

    test('it should fail when minFuzzyLevel has invalid number', () => {
        const minFuzzyLevel = 6;
        expect(() =>
            validateRequestSchema({ apiKey, query, minFuzzyLevel }, { schema: fuzzySearchRequestSchema }),
        ).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: 'too_big',
                        maximum: 4,
                        type: 'number',
                        inclusive: true,
                        exact: false,
                        message: 'Number must be less than or equal to 4',
                        path: ['minFuzzyLevel'],
                    },
                    {
                        code: 'custom',
                        message: 'commonBaseURL or customServiceBaseURL is required',
                        path: [],
                    },
                ],
            }),
        );
    });

    //
    test('it should fail when map-code is not of type array', () => {
        const mapcodes = 'Local';
        expect(() =>
            validateRequestSchema({ apiKey, query: 'Fuel Station', mapcodes }, { schema: fuzzySearchRequestSchema }),
        ).toThrow(
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

    test('it should fail when view is not amongst the defined enums', () => {
        const view = 'CH';
        expect(() => validateRequestSchema({ apiKey, query, view }, { schema: fuzzySearchRequestSchema })).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        received: 'CH',
                        code: 'invalid_enum_value',
                        options: ['Unified', 'AR', 'IN', 'PK', 'IL', 'MA', 'RU', 'TR', 'CN'],
                        path: ['view'],
                        message:
                            'Invalid enum value. ' +
                            "Expected 'Unified' | 'AR' | 'IN' | 'PK' | 'IL' | 'MA' | 'RU' | 'TR' | 'CN', received 'CH'",
                    },
                ],
            }),
        );
    });

    test('it should fail when index is not of type array', () => {
        const indexes = 'STR';
        expect(() => validateRequestSchema({ apiKey, query, indexes }, { schema: fuzzySearchRequestSchema })).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: 'invalid_type',
                        expected: 'array',
                        received: 'string',
                        path: ['indexes'],
                        message: 'Expected array, received string',
                    },
                ],
            }),
        );
    });
    //
    test('it should fail when POI categories are not of type array', () => {
        const poiCategories = 7315025;
        expect(() =>
            validateRequestSchema({ apiKey, query, poiCategories }, { schema: fuzzySearchRequestSchema }),
        ).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: 'invalid_type',
                        expected: 'array',
                        received: 'number',
                        path: ['poiCategories'],
                        message: 'Expected array, received number',
                    },
                ],
            }),
        );
    });

    test('it should fail when POI brands is of type string', () => {
        const poiBrands = 'TomTom';
        expect(() => validateRequestSchema({ apiKey, query, poiBrands }, { schema: fuzzySearchRequestSchema })).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: 'invalid_type',
                        expected: 'array',
                        received: 'string',
                        path: ['poiBrands'],
                        message: 'Expected array, received string',
                    },
                ],
            }),
        );
    });

    test('it should fail when connectors is of type string', () => {
        const connectors = 'IEC62196Type1';
        expect(() =>
            validateRequestSchema({ apiKey, query: 'EV', connectors }, { schema: fuzzySearchRequestSchema }),
        ).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: 'invalid_type',
                        expected: 'array',
                        received: 'string',
                        path: ['connectors'],
                        message: 'Expected array, received string',
                    },
                ],
            }),
        );
    });

    test('it should fail when fuel is of type string', () => {
        const fuelTypes = 'AdBlue';

        expect(() =>
            validateRequestSchema({ apiKey, query: 'Fuel', fuelTypes }, { schema: fuzzySearchRequestSchema }),
        ).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: 'invalid_type',
                        expected: 'array',
                        received: 'string',
                        path: ['fuelTypes'],
                        message: 'Expected array, received string',
                    },
                ],
            }),
        );
    });

    test('it should fail when geography type is of type string', () => {
        const geographyTypes = 'Municipality';
        expect(() =>
            validateRequestSchema({ apiKey, query, geographyTypes }, { schema: fuzzySearchRequestSchema }),
        ).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: 'invalid_type',
                        expected: 'array',
                        received: 'string',
                        path: ['geographyTypes'],
                        message: 'Expected array, received string',
                    },
                ],
            }),
        );
    });

    test('it should fail when lan and lon parameters are not between permitted values', () => {
        const validationCall = () =>
            validateRequestSchema(
                {
                    query,
                    position: [200, -180],
                    apiKey,
                },
                { schema: fuzzySearchRequestSchema },
            );
        expect(validationCall).toThrow(
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
                    {
                        code: 'custom',
                        message: 'commonBaseURL or customServiceBaseURL is required',
                        path: [],
                    },
                ],
            }),
        );
    });
});

describe('Fuzzy Search request schema performance tests', () => {
    test('Fuzzy Search request URL schema performance test', async () => {
        expect(
            bestExecutionTimeMS(
                () =>
                    validateRequestSchema(fuzzySearchReqObjects as FuzzySearchParams, {
                        schema: fuzzySearchRequestSchema,
                    }),
                10,
            ),
        ).toBeLessThan(MAX_EXEC_TIMES_MS.search.fuzzySearch.schemaValidation);
    });
});
