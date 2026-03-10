import { describe, expect, test } from 'vitest';
import { bestExecutionTimeMS } from '../../../../core/src/util/tests/performanceTestUtils';
import { validateRequestSchema } from '../../shared/schema/validation';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { poiCategoriesRequestSchema } from '../poiCategoriesRequestSchema';
import type { POICategoriesParams } from '../types';
import { poiCategoriesReqObjects } from './requestBuilderPerf.data';

describe('POI categories schema validation', () => {
    const apiKey = 'APIKEY';
    const commonBaseUrl = 'https://api-test.tomtom.com';

    test('it should pass with no filters', () => {
        const validParams: POICategoriesParams = {
            apiKey,
            commonBaseURL: commonBaseUrl,
        };
        expect(() => validateRequestSchema(validParams, { schema: poiCategoriesRequestSchema })).not.toThrow();
    });

    test('it should pass with a valid filters array', () => {
        const validParams: POICategoriesParams = {
            apiKey,
            commonBaseURL: commonBaseUrl,
            filters: ['gym'],
        };
        expect(() => validateRequestSchema(validParams, { schema: poiCategoriesRequestSchema })).not.toThrow();
    });

    test('it should pass with multiple filter strings', () => {
        const validParams: POICategoriesParams = {
            apiKey,
            commonBaseURL: commonBaseUrl,
            filters: ['gym', 'restaurant'],
        };
        expect(() => validateRequestSchema(validParams, { schema: poiCategoriesRequestSchema })).not.toThrow();
    });

    test('it should fail when filters is not an array', () => {
        const invalidParams = {
            apiKey,
            commonBaseURL: commonBaseUrl,
            // @ts-ignore
            filters: 'gym',
        };
        expect(() => validateRequestSchema(invalidParams, { schema: poiCategoriesRequestSchema })).toThrow(
            expect.objectContaining({
                issues: [
                    expect.objectContaining({
                        code: 'invalid_type',
                        expected: 'array',
                        path: ['filters'],
                    }),
                ],
            }),
        );
    });

    test('it should fail when neither commonBaseURL nor customServiceBaseURL is provided', () => {
        const invalidParams = {
            apiKey,
        };
        expect(() => validateRequestSchema(invalidParams, { schema: poiCategoriesRequestSchema })).toThrow(
            expect.objectContaining({
                issues: [
                    expect.objectContaining({
                        code: 'custom',
                        message: 'commonBaseURL or customServiceBaseURL is required',
                    }),
                ],
            }),
        );
    });
});

describe('POI categories request schema performance tests', () => {
    test('POI categories request schema performance test', () => {
        expect(
            bestExecutionTimeMS(
                () =>
                    validateRequestSchema(poiCategoriesReqObjects, {
                        schema: poiCategoriesRequestSchema,
                    }),
                10,
            ),
        ).toBeLessThan(MAX_EXEC_TIMES_MS.poiCategories.schemaValidation);
    });
});
