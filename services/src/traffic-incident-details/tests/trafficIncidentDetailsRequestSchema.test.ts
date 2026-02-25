import { describe, expect, test } from 'vitest';
import { bestExecutionTimeMS } from '../../../../core/src/util/tests/performanceTestUtils';
import { validateRequestSchema } from '../../shared/schema/validation';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { trafficIncidentDetailsRequestSchema } from '../trafficIncidentDetailsRequestSchema';

const COMMON = {
    apiKey: 'TEST_KEY',
    apiVersion: 1,
    commonBaseURL: 'https://api.tomtom.com',
} as const;

describe('Traffic Incident Details schema — valid inputs', () => {
    test('accepts bbox params', () => {
        expect(() =>
            validateRequestSchema(
                { ...COMMON, bbox: [4.728, 52.278, 5.08, 52.479] },
                { schema: trafficIncidentDetailsRequestSchema },
            ),
        ).not.toThrow();
    });

    test('accepts ids params', () => {
        expect(() =>
            validateRequestSchema(
                { ...COMMON, ids: ['id-1', 'id-2'] },
                { schema: trafficIncidentDetailsRequestSchema },
            ),
        ).not.toThrow();
    });
});

describe('Traffic Incident Details schema — bbox validation', () => {
    test('fails when bbox is an object instead of a tuple', () => {
        expect(() =>
            validateRequestSchema(
                // @ts-ignore
                { ...COMMON, bbox: { minLon: 4.7, minLat: 52.2, maxLon: 5.0, maxLat: 52.4 } },
                { schema: trafficIncidentDetailsRequestSchema },
            ),
        ).toThrow('Invalid input');
    });

    test('fails when bbox is a string', () => {
        expect(() =>
            validateRequestSchema(
                // @ts-ignore
                { ...COMMON, bbox: '4.7,52.2,5.0,52.4' },
                { schema: trafficIncidentDetailsRequestSchema },
            ),
        ).toThrow('Invalid input');
    });

    test('fails when bbox has fewer than 4 elements', () => {
        expect(() =>
            validateRequestSchema(
                // @ts-ignore
                { ...COMMON, bbox: [4.7, 52.2, 5.0] },
                { schema: trafficIncidentDetailsRequestSchema },
            ),
        ).toThrow();
    });

    test('fails when bbox has more than 4 elements', () => {
        expect(() =>
            validateRequestSchema(
                // @ts-ignore
                { ...COMMON, bbox: [4.7, 52.2, 5.0, 52.4, 0] },
                { schema: trafficIncidentDetailsRequestSchema },
            ),
        ).toThrow();
    });

    test('fails when bbox contains non-numeric values', () => {
        expect(() =>
            validateRequestSchema(
                // @ts-ignore
                { ...COMMON, bbox: ['west', 'south', 'east', 'north'] },
                { schema: trafficIncidentDetailsRequestSchema },
            ),
        ).toThrow(
            expect.objectContaining({
                issues: expect.arrayContaining([expect.objectContaining({ code: 'invalid_type', expected: 'number' })]),
            }),
        );
    });
});

describe('Traffic Incident Details schema — ids validation', () => {
    test('fails when ids is a string instead of an array', () => {
        expect(() =>
            validateRequestSchema(
                // @ts-ignore
                { ...COMMON, ids: 'id-1,id-2' },
                { schema: trafficIncidentDetailsRequestSchema },
            ),
        ).toThrow(
            expect.objectContaining({
                issues: expect.arrayContaining([
                    expect.objectContaining({ code: 'invalid_type', expected: 'array', path: ['ids'] }),
                ]),
            }),
        );
    });

    test('fails when ids contains non-string elements', () => {
        expect(() =>
            validateRequestSchema(
                // @ts-ignore
                { ...COMMON, ids: [1, 2, 3] },
                { schema: trafficIncidentDetailsRequestSchema },
            ),
        ).toThrow(
            expect.objectContaining({
                issues: expect.arrayContaining([expect.objectContaining({ code: 'invalid_type', expected: 'string' })]),
            }),
        );
    });
});

describe('Traffic Incident Details schema — categoryFilter validation', () => {
    test('fails when categoryFilter is a string instead of an array', () => {
        expect(() =>
            validateRequestSchema(
                // @ts-ignore
                { ...COMMON, bbox: [0, 0, 1, 1], categoryFilter: '1,6,8' },
                { schema: trafficIncidentDetailsRequestSchema },
            ),
        ).toThrow(
            expect.objectContaining({
                issues: expect.arrayContaining([
                    expect.objectContaining({ code: 'invalid_type', expected: 'array', path: ['categoryFilter'] }),
                ]),
            }),
        );
    });

    test('fails when categoryFilter contains invalid enum values', () => {
        expect(() =>
            validateRequestSchema(
                // @ts-ignore
                { ...COMMON, bbox: [0, 0, 1, 1], categoryFilter: ['invalid-category', 'unknown-type'] },
                { schema: trafficIncidentDetailsRequestSchema },
            ),
        ).toThrow(
            expect.objectContaining({
                issues: expect.arrayContaining([expect.objectContaining({ code: 'invalid_value' })]),
            }),
        );
    });
});

describe('Traffic Incident Details schema — timeValidityFilter validation', () => {
    test('fails when timeValidityFilter is a string instead of an array', () => {
        expect(() =>
            validateRequestSchema(
                // @ts-ignore
                { ...COMMON, bbox: [0, 0, 1, 1], timeValidityFilter: 'present' },
                { schema: trafficIncidentDetailsRequestSchema },
            ),
        ).toThrow(
            expect.objectContaining({
                issues: expect.arrayContaining([
                    expect.objectContaining({
                        code: 'invalid_type',
                        expected: 'array',
                        path: ['timeValidityFilter'],
                    }),
                ]),
            }),
        );
    });

    test('fails when timeValidityFilter contains an invalid enum value', () => {
        expect(() =>
            validateRequestSchema(
                // @ts-ignore
                { ...COMMON, bbox: [0, 0, 1, 1], timeValidityFilter: ['present', 'past'] },
                { schema: trafficIncidentDetailsRequestSchema },
            ),
        ).toThrow(
            expect.objectContaining({
                issues: expect.arrayContaining([expect.objectContaining({ code: 'invalid_value' })]),
            }),
        );
    });
});

describe('Traffic Incident Details schema — bbox/ids mutual exclusivity', () => {
    // validateRequestSchema reconstructs the schema via .shape, which strips .refine().
    // Test mutual exclusivity directly on the schema to preserve the refinement.
    test('fails when both bbox and ids are provided', () => {
        const result = trafficIncidentDetailsRequestSchema.safeParse({
            ...COMMON,
            bbox: [4.728, 52.278, 5.08, 52.479],
            ids: ['id-1'],
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('Provide either bbox or ids, not both');
        }
    });

    test('accepts bbox without ids', () => {
        expect(() =>
            validateRequestSchema(
                { ...COMMON, bbox: [4.728, 52.278, 5.08, 52.479] },
                { schema: trafficIncidentDetailsRequestSchema },
            ),
        ).not.toThrow();
    });

    test('accepts ids without bbox', () => {
        expect(() =>
            validateRequestSchema(
                { ...COMMON, ids: ['id-1', 'id-2'] },
                { schema: trafficIncidentDetailsRequestSchema },
            ),
        ).not.toThrow();
    });
});

describe('Traffic Incident Details schema — performance tests', () => {
    const perfParams = { ...COMMON, bbox: [4.728, 52.278, 5.08, 52.479] as [number, number, number, number] };

    test('schema validation completes within time limit', () => {
        expect(
            bestExecutionTimeMS(
                () => validateRequestSchema(perfParams, { schema: trafficIncidentDetailsRequestSchema }),
                10,
            ),
        ).toBeLessThan(MAX_EXEC_TIMES_MS.trafficIncidentDetails.schemaValidation);
    });
});
