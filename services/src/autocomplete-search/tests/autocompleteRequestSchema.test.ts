import { bestExecutionTimeMS } from 'core/src/util/tests/performanceTestUtils';
import { describe, expect, test } from 'vitest';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { validateRequestSchema } from '../../shared/validation';
import { autocompleteSearchRequestSchema } from '../autocompleteSearchRequestSchema';
import type { AutocompleteSearchParams } from '../types';
import autocompleteSearchReqObjects from './requestBuilderPerf.data.json';

describe('Autocomplete Schema Validation', () => {
    const commonBaseUrl = 'https://tomtom.com';
    const apiKey = 'API_KEY';
    const query = 'cafe';

    test('it should fail when query is missing', () => {
        expect(() =>
            validateRequestSchema(
                { commonBaseURL: commonBaseUrl, apiKey },
                { schema: autocompleteSearchRequestSchema },
            ),
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

    test('it should fail when query is a number', () => {
        const queryNum = 5;
        expect(() =>
            validateRequestSchema(
                { commonBaseURL: commonBaseUrl, apiKey, query: queryNum },
                { schema: autocompleteSearchRequestSchema },
            ),
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

    test('it should fail when countries is of type string', () => {
        const countries = 'NL';
        expect(() =>
            validateRequestSchema(
                { commonBaseURL: commonBaseUrl, apiKey, query, countries },
                { schema: autocompleteSearchRequestSchema },
            ),
        ).toThrow(
            expect.objectContaining({
                issues: [
                    {
                        code: 'invalid_type',
                        expected: 'array',
                        path: ['countries'],
                        message: 'Invalid input',
                    },
                ],
            }),
        );
    });

    test('it should fail when resultType is of type number', () => {
        const resultType = 5;
        expect(() =>
            validateRequestSchema(
                { commonBaseURL: commonBaseUrl, apiKey, query, resultType },
                { schema: autocompleteSearchRequestSchema },
            ),
        ).toThrow(
            expect.objectContaining({
                issues: [
                    {
                        code: 'invalid_type',
                        expected: 'array',
                        path: ['resultType'],
                        message: 'Invalid input',
                    },
                ],
            }),
        );
    });

    test('it should fail when radiusMeters is of type string', () => {
        expect(() =>
            validateRequestSchema(
                { commonBaseURL: commonBaseUrl, apiKey, query, radiusMeters: '600' },
                { schema: autocompleteSearchRequestSchema },
            ),
        ).toThrow(
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

    describe('Autocomplete request schema performance tests', () => {
        test.each(autocompleteSearchReqObjects)(
            "'%s'",
            // @ts-ignore
            (_title: string, params: AutocompleteSearchParams) => {
                expect(
                    bestExecutionTimeMS(
                        () => validateRequestSchema(params, { schema: autocompleteSearchRequestSchema }),
                        10,
                    ),
                ).toBeLessThan(MAX_EXEC_TIMES_MS.autocomplete.schemaValidation);
            },
        );
    });
});
