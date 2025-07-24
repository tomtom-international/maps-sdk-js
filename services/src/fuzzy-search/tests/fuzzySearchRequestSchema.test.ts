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
                issues: [
                    expect.objectContaining({
                        code: 'invalid_type',
                        expected: 'string',
                        path: ['query'],
                        message: 'Invalid input',
                    }),
                ],
            }),
        );
    });

    test('it should fail when query is not of type string', () => {
        expect(() => validateRequestSchema({ apiKey, query: undefined }, { schema: fuzzySearchRequestSchema })).toThrow(
            expect.objectContaining({
                issues: [
                    expect.objectContaining({
                        code: 'invalid_type',
                        expected: 'string',
                        path: ['query'],
                        message: 'Invalid input',
                    }),
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
                issues: expect.arrayContaining([
                    expect.objectContaining({
                        path: ['minFuzzyLevel'],
                        message: 'Invalid input',
                    }),
                    expect.objectContaining({
                        path: ['maxFuzzyLevel'],
                        message: 'Invalid input',
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
                issues: [
                    expect.objectContaining({
                        code: 'invalid_type',
                        expected: 'boolean',
                        path: ['typeahead'],
                        message: 'Invalid input',
                    }),
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
                issues: [
                    expect.objectContaining({
                        // code: 'too_big',
                        maximum: 4,
                        origin: 'number',
                        // inclusive: true,
                        // exact: false,
                        message: 'Invalid input',
                        path: ['minFuzzyLevel'],
                    }),
                    expect.objectContaining({
                        code: 'custom',
                        path: [],
                        message: 'commonBaseURL or customServiceBaseURL is required',
                    }),
                ],
            }),
        );
    });

    test('it should fail when map-code is not of type array', () => {
        const mapcodes = 'Local';
        expect(() => validateRequestSchema({ apiKey, query, mapcodes }, { schema: fuzzySearchRequestSchema })).toThrow(
            expect.objectContaining({
                issues: [
                    expect.objectContaining({
                        code: 'invalid_type',
                        expected: 'array',
                        path: ['mapcodes'],
                        message: 'Invalid input',
                    }),
                ],
            }),
        );
    });

    test('it should fail when view is not amongst the defined enums', () => {
        const view = 'CH';
        expect(() => validateRequestSchema({ apiKey, query, view }, { schema: fuzzySearchRequestSchema })).toThrow(
            expect.objectContaining({
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

    test('it should fail when index is not of type array', () => {
        const indexes = 'STR';
        expect(() => validateRequestSchema({ apiKey, query, indexes }, { schema: fuzzySearchRequestSchema })).toThrow(
            expect.objectContaining({
                issues: [
                    expect.objectContaining({
                        code: 'invalid_type',
                        expected: 'array',
                        path: ['indexes'],
                        message: 'Invalid input',
                    }),
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
                issues: [
                    expect.objectContaining({
                        code: 'invalid_type',
                        expected: 'array',
                        path: ['poiCategories'],
                        message: 'Invalid input',
                    }),
                ],
            }),
        );
    });

    test('it should fail when POI brands is of type string', () => {
        const poiBrands = 'TomTom';
        expect(() => validateRequestSchema({ apiKey, query, poiBrands }, { schema: fuzzySearchRequestSchema })).toThrow(
            expect.objectContaining({
                issues: [
                    expect.objectContaining({
                        code: 'invalid_type',
                        expected: 'array',
                        path: ['poiBrands'],
                        message: 'Invalid input',
                    }),
                ],
            }),
        );
    });

    test('it should fail when connectors is of type string', () => {
        const connectors = 'IEC62196Type1';
        expect(() =>
            validateRequestSchema({ apiKey, query, connectors }, { schema: fuzzySearchRequestSchema }),
        ).toThrow(
            expect.objectContaining({
                issues: [
                    expect.objectContaining({
                        code: 'invalid_type',
                        path: ['connectors'],
                        message: 'Invalid input',
                    }),
                ],
            }),
        );
    });

    test('it should fail when fuel is of type string', () => {
        const fuelTypes = 'AdBlue';

        expect(() => validateRequestSchema({ apiKey, query, fuelTypes }, { schema: fuzzySearchRequestSchema })).toThrow(
            expect.objectContaining({
                issues: [
                    expect.objectContaining({
                        code: 'invalid_type',
                        expected: 'array',
                        path: ['fuelTypes'],
                        message: 'Invalid input',
                    }),
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
                issues: [
                    expect.objectContaining({
                        code: 'invalid_type',
                        expected: 'array',
                        path: ['geographyTypes'],
                        message: 'Invalid input',
                    }),
                ],
            }),
        );
    });

    test('it should fail when lan and lon (position) parameters are not between permitted values', () => {
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
                issues: expect.arrayContaining([
                    expect.objectContaining({
                        message: expect.stringContaining('commonBaseURL or customServiceBaseURL is required'),
                    }),
                    expect.objectContaining({
                        origin: 'number',
                        code: 'too_big',
                        maximum: 180,
                        path: ['position', 0],
                    }),
                    expect.objectContaining({
                        origin: 'number',
                        code: 'too_small',
                        minimum: -90,
                        path: ['position', 1],
                    }),
                ]),
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
