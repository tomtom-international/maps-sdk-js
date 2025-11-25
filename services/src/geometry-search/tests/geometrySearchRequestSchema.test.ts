import { describe, expect, test } from 'vitest';
import { bestExecutionTimeMS } from '../../../../core/src/util/tests/performanceTestUtils';
import { geometrySearchReqObjects } from '../../geometry-search/tests/requestBuilderPerf.data';
import { validateRequestSchema } from '../../shared/schema/validation';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { geometrySearchRequestSchema } from '../geometrySearchRequestSchema';
import type { GeometrySearchParams, SearchGeometryInput } from '../types';

describe('GeometrySearch Schema Validation', () => {
    const config = { schema: geometrySearchRequestSchema };
    const apiKey = 'APIKEY';
    const commonBaseUrl = 'https://api-test.tomtom.com';

    const geometries: SearchGeometryInput[] = [
        {
            type: 'Polygon',
            coordinates: [
                [
                    [-122.43576, 37.75241],
                    [-122.433013, 37.7066],
                    [-122.36434, 37.71205],
                    [-122.373962, 37.7535],
                ],
            ],
        },
        {
            type: 'Circle',
            coordinates: [-121.36434, 37.71205],
            radius: 6000,
        },
    ];

    test('it should pass when poi category is of type array consisting poi category IDs', () => {
        expect(
            validateRequestSchema<GeometrySearchParams>(
                {
                    apiKey,
                    commonBaseURL: commonBaseUrl,
                    query: 'restaurant',
                    geometries,
                    poiCategories: [7315, 7315081],
                },
                config,
            ),
        ).toMatchObject({ query: 'restaurant', poiCategories: [7315, 7315081] });
    });

    test('it should pass when poi category is of type array consisting human readable category names', () => {
        expect(
            validateRequestSchema(
                {
                    apiKey,
                    commonBaseURL: commonBaseUrl,
                    query: 'restaurant',
                    geometries,
                    poiCategories: ['ITALIAN_RESTAURANT', 'FRENCH_RESTAURANT'],
                },
                config,
            ),
        ).toMatchObject({ query: 'restaurant', poiCategories: ['ITALIAN_RESTAURANT', 'FRENCH_RESTAURANT'] });
    });

    test('it should fail when missing coordinates property', () => {
        expect(() =>
            validateRequestSchema(
                { query: 'cafe', geometries: [{ type: 'Circle', radius: 6000 }], apiKey, commonBaseURL: commonBaseUrl },
                config,
            ),
        ).toThrow('Invalid input');
    });

    test('it should fail when missing type property', () => {
        expect(() =>
            validateRequestSchema(
                {
                    query: 'cafe',
                    geometries: [{ radius: 6000, coordinates: [37.71205, -121.36434] }],
                    apiKey,
                    commonBaseURL: commonBaseUrl,
                },
                config,
            ),
        ).toThrow('Invalid input');
    });

    test('it should fail when geometryList property is missing', () => {
        const query = 'cafe';
        expect(() => validateRequestSchema({ query, apiKey, commonBaseURL: commonBaseUrl }, config)).toThrow(
            'Invalid input',
        );
    });

    test('it should fail when type Circle is missing radius property', () => {
        const query = 'cafe';
        const incorrectGeometry = [
            {
                type: 'Circle',
                coordinates: [-121.36434, 37.71205],
            },
        ];

        expect(() =>
            validateRequestSchema(
                { query, geometries: [incorrectGeometry], apiKey, commonBaseURL: commonBaseUrl },
                config,
            ),
        ).toThrow('Invalid input');
    });

    test('it should fail when query is missing', () => {
        expect(() => validateRequestSchema({ geometries, apiKey, commonBaseURL: commonBaseUrl }, config)).toThrow(
            expect.objectContaining({
                issues: [
                    {
                        code: 'invalid_type',
                        expected: 'string',
                        path: ['query'],
                        message: 'Invalid input',
                    },
                ],
            }),
        );
    });

    test('it should fail when query is not of type string', () => {
        const query = undefined;
        expect(() =>
            validateRequestSchema({ query, geometries, apiKey, commonBaseURL: commonBaseUrl }, config),
        ).toThrow(
            expect.objectContaining({
                issues: [
                    {
                        code: 'invalid_type',
                        expected: 'string',
                        path: ['query'],
                        message: 'Invalid input',
                    },
                ],
            }),
        );
    });

    test('it should fail when map-code is not of type array', () => {
        const query = 'Fuel Station';
        const mapcodes = 'Local';

        expect(() =>
            validateRequestSchema({ query, geometries, mapcodes, apiKey, commonBaseURL: commonBaseUrl }, config),
        ).toThrow(
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

    test('it should fail when view is not amongst the defined enums', () => {
        const query = 'POI';
        const view = 'CH';
        expect(() =>
            validateRequestSchema({ query, geometries, view, apiKey, commonBaseURL: commonBaseUrl }, config),
        ).toThrow(
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

    test('it should fail when index is not of type array', () => {
        const query = 'Noe Valley, San Francisco';
        const indexes = 'STR';

        expect(() =>
            validateRequestSchema({ query, geometries, indexes, apiKey, commonBaseURL: commonBaseUrl }, config),
        ).toThrow(
            expect.objectContaining({
                issues: [
                    {
                        code: 'invalid_type',
                        expected: 'array',
                        path: ['indexes'],
                        message: 'Invalid input',
                    },
                ],
            }),
        );
    });

    test('it should fail when POI categories are not of type array', () => {
        const query = 'Restaurant';
        const poiCategories = 7315025;

        expect(() =>
            validateRequestSchema({ query, geometries, poiCategories, apiKey, commonBaseURL: commonBaseUrl }, config),
        ).toThrow(
            expect.objectContaining({
                issues: [
                    {
                        expected: 'array',
                        code: 'invalid_type',
                        path: ['poiCategories'],
                        message: 'Invalid input',
                    },
                ],
            }),
        );
    });

    test('it should fail when POI categories are of type string-array', () => {
        expect(() =>
            validateRequestSchema(
                {
                    apiKey,
                    commonBaseURL: commonBaseUrl,
                    query: 'Restaurant',
                    geometries,
                    // @ts-ignore
                    poiCategories: ['7315025'],
                },
                config,
            ),
        ).toThrow();
    });

    test('it should fail when POI brands is of type string', () => {
        const query = 'Restaurant';
        const poiBrands = 'TomTom';

        expect(() =>
            validateRequestSchema({ query, geometries, poiBrands, apiKey, commonBaseURL: commonBaseUrl }, config),
        ).toThrow(
            expect.objectContaining({
                issues: [
                    {
                        code: 'invalid_type',
                        expected: 'array',
                        path: ['poiBrands'],
                        message: 'Invalid input',
                    },
                ],
            }),
        );
    });

    test('it should fail when connectors is of type string', () => {
        const query = 'EV';
        const connectors = 'IEC62196Type1';

        expect(() =>
            validateRequestSchema({ query, geometries, connectors, apiKey, commonBaseURL: commonBaseUrl }, config),
        ).toThrow(
            expect.objectContaining({
                issues: [
                    {
                        code: 'invalid_type',
                        expected: 'array',
                        path: ['connectors'],
                        message: 'Invalid input',
                    },
                ],
            }),
        );
    });

    test('it should fail when fuel is of type string', () => {
        const query = 'EV';
        const fuelTypes = 'AdBlue';

        expect(() =>
            validateRequestSchema({ query, geometries, fuelTypes, apiKey, commonBaseURL: commonBaseUrl }, config),
        ).toThrow(
            expect.objectContaining({
                issues: [
                    {
                        code: 'invalid_type',
                        expected: 'array',
                        path: ['fuelTypes'],
                        message: 'Invalid input',
                    },
                ],
            }),
        );
    });

    test('it should fail when geography type is of type string', () => {
        const query = 'EV';
        const geographyTypes = 'Municipality';

        expect(() =>
            validateRequestSchema({ query, geometries, geographyTypes, apiKey, commonBaseURL: commonBaseUrl }, config),
        ).toThrow(
            expect.objectContaining({
                issues: [
                    {
                        code: 'invalid_type',
                        expected: 'array',
                        path: ['geographyTypes'],
                        message: 'Invalid input',
                    },
                ],
            }),
        );
    });

    test('it should fail when lan and lon parameters are not between permitted values', () => {
        const query = 'EV';
        const position = [-200, 95];
        expect(() =>
            validateRequestSchema({ query, geometries, position, apiKey, commonBaseURL: commonBaseUrl }, config),
        ).toThrow(
            expect.objectContaining({
                issues: expect.arrayContaining([
                    expect.objectContaining({ code: 'too_small' }),
                    expect.objectContaining({ code: 'too_big' }),
                ]),
            }),
        );
    });
});

describe('Geometry Search request schema performance tests', () => {
    test('Geometry Search request schema performance test', () => {
        expect(
            bestExecutionTimeMS(
                () =>
                    validateRequestSchema(geometrySearchReqObjects as GeometrySearchParams, {
                        schema: geometrySearchRequestSchema,
                    }),
                10,
            ),
        ).toBeLessThan(MAX_EXEC_TIMES_MS.search.geometrySearch.schemaValidation);
    });
});
