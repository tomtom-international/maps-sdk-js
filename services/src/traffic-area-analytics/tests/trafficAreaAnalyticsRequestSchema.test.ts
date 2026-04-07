import { describe, expect, test } from 'vitest';
import { bestExecutionTimeMS } from '../../../../core/src/util/tests/performanceTestUtils';
import { validateRequestSchema } from '../../shared/schema/validation';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { trafficAreaAnalyticsRequestSchema } from '../trafficAreaAnalyticsRequestSchema';

const COMMON = {
    apiKey: 'TEST_KEY',
    apiVersion: 1,
    commonBaseURL: 'https://api.tomtom.com',
} as const;

const POLYGON_GEOMETRY = {
    type: 'Polygon',
    coordinates: [
        [
            [4.896128, 52.382402],
            [4.875701, 52.368459],
            [4.923611, 52.36341],
            [4.896128, 52.382402],
        ],
    ],
};

const MULTI_POLYGON_GEOMETRY = {
    type: 'MultiPolygon',
    coordinates: [
        [
            [
                [4.896128, 52.382402],
                [4.875701, 52.368459],
                [4.923611, 52.36341],
                [4.896128, 52.382402],
            ],
        ],
    ],
};

const VALID_PARAMS = {
    ...COMMON,
    startDate: new Date('2024-08-05'),
    endDate: new Date('2024-08-06'),
    metrics: ['speed', 'congestionLevel'] as const,
    functionalRoadClasses: ['MOTORWAY', 'MAJOR_ROAD', 'OTHER_MAJOR_ROAD'] as const,
    hours: [7, 8],
    geometry: POLYGON_GEOMETRY,
};

describe('Traffic Area Analytics schema — valid inputs', () => {
    test('accepts minimal valid params', () => {
        expect(() => validateRequestSchema(VALID_PARAMS, { schema: trafficAreaAnalyticsRequestSchema })).not.toThrow();
    });

    test('accepts params with all metrics', () => {
        expect(() =>
            validateRequestSchema(
                {
                    ...VALID_PARAMS,
                    metrics: ['speed', 'freeFlowSpeed', 'congestionLevel', 'travelTime', 'networkLength'],
                },
                { schema: trafficAreaAnalyticsRequestSchema },
            ),
        ).not.toThrow();
    });

    test('accepts a MultiPolygon geometry', () => {
        expect(() =>
            validateRequestSchema(
                { ...VALID_PARAMS, geometry: MULTI_POLYGON_GEOMETRY },
                { schema: trafficAreaAnalyticsRequestSchema },
            ),
        ).not.toThrow();
    });

    test('accepts startDate without endDate (defaults to today)', () => {
        expect(() =>
            validateRequestSchema({ ...VALID_PARAMS }, { schema: trafficAreaAnalyticsRequestSchema }),
        ).not.toThrow();
    });

    test('accepts date range spanning multiple days within 31-day limit', () => {
        expect(() =>
            validateRequestSchema(
                {
                    ...VALID_PARAMS,
                    startDate: new Date('2024-08-01'),
                    endDate: new Date('2024-08-31'),
                },
                { schema: trafficAreaAnalyticsRequestSchema },
            ),
        ).not.toThrow();
    });

    test('accepts all 24 hours', () => {
        expect(() =>
            validateRequestSchema(
                { ...VALID_PARAMS, hours: Array.from({ length: 24 }, (_, i) => i) },
                { schema: trafficAreaAnalyticsRequestSchema },
            ),
        ).not.toThrow();
    });

    test("accepts hours: 'all'", () => {
        expect(() =>
            validateRequestSchema({ ...VALID_PARAMS, hours: 'all' }, { schema: trafficAreaAnalyticsRequestSchema }),
        ).not.toThrow();
    });

    test('accepts all nine FRC string values', () => {
        expect(() =>
            validateRequestSchema(
                {
                    ...VALID_PARAMS,
                    functionalRoadClasses: [
                        'MOTORWAY',
                        'MAJOR_ROAD',
                        'OTHER_MAJOR_ROAD',
                        'SECONDARY_ROAD',
                        'LOCAL_CONNECTING_ROAD',
                        'LOCAL_ROAD_HIGH_IMPORTANCE',
                        'LOCAL_ROAD',
                        'LOCAL_ROAD_MINOR_IMPORTANCE',
                        'OTHER_ROAD',
                    ],
                },
                { schema: trafficAreaAnalyticsRequestSchema },
            ),
        ).not.toThrow();
    });

    test("accepts functionalRoadClasses: 'all'", () => {
        expect(() =>
            validateRequestSchema(
                { ...VALID_PARAMS, functionalRoadClasses: 'all' },
                { schema: trafficAreaAnalyticsRequestSchema },
            ),
        ).not.toThrow();
    });
});

describe('Traffic Area Analytics schema — date string inputs', () => {
    test('accepts YYYY-MM-DD string for startDate', () => {
        expect(() =>
            validateRequestSchema(
                { ...VALID_PARAMS, startDate: '2024-08-05' },
                { schema: trafficAreaAnalyticsRequestSchema },
            ),
        ).not.toThrow();
    });

    test('accepts YYYY-MM-DD string for endDate', () => {
        expect(() =>
            validateRequestSchema(
                { ...VALID_PARAMS, endDate: '2024-08-06' },
                { schema: trafficAreaAnalyticsRequestSchema },
            ),
        ).not.toThrow();
    });

    test('accepts YYYY-MM-DD strings for both startDate and endDate', () => {
        expect(() =>
            validateRequestSchema(
                { ...VALID_PARAMS, startDate: '2024-08-01', endDate: '2024-08-07' },
                { schema: trafficAreaAnalyticsRequestSchema },
            ),
        ).not.toThrow();
    });

    test('rejects startDate strings not in YYYY-MM-DD format', () => {
        expect(() =>
            validateRequestSchema(
                // @ts-ignore
                { ...VALID_PARAMS, startDate: '06-08-2024' },
                { schema: trafficAreaAnalyticsRequestSchema },
            ),
        ).toThrow();
    });

    test('rejects endDate strings not in YYYY-MM-DD format', () => {
        expect(() =>
            validateRequestSchema(
                // @ts-ignore
                { ...VALID_PARAMS, endDate: '2024/08/06' },
                { schema: trafficAreaAnalyticsRequestSchema },
            ),
        ).toThrow();
    });
});

describe('Traffic Area Analytics schema — days field', () => {
    const DAYS_PARAMS = {
        ...COMMON,
        days: ['2024-08-05', '2024-08-12', '2024-08-19', '2024-08-26'],
        metrics: ['speed'] as const,
        functionalRoadClasses: ['MOTORWAY', 'MAJOR_ROAD', 'OTHER_MAJOR_ROAD'] as const,
        hours: [8, 9],
        geometry: POLYGON_GEOMETRY,
    };

    test('accepts valid days array with string dates', () => {
        expect(() => validateRequestSchema(DAYS_PARAMS, { schema: trafficAreaAnalyticsRequestSchema })).not.toThrow();
    });

    test('accepts valid days array with Date objects', () => {
        expect(() =>
            validateRequestSchema(
                { ...DAYS_PARAMS, days: [new Date('2024-08-05'), new Date('2024-08-12')] },
                { schema: trafficAreaAnalyticsRequestSchema },
            ),
        ).not.toThrow();
    });

    test('rejects when both days and startDate/endDate are provided', () => {
        const result = trafficAreaAnalyticsRequestSchema.safeParse({
            ...DAYS_PARAMS,
            startDate: new Date('2024-08-01'),
            endDate: new Date('2024-08-07'),
        });
        expect(result.success).toBe(false);
    });

    test('rejects when neither days nor startDate/endDate are provided', () => {
        const { startDate: _s, endDate: _e, ...withoutDates } = VALID_PARAMS;
        const result = trafficAreaAnalyticsRequestSchema.safeParse(withoutDates);
        expect(result.success).toBe(false);
    });

    test('rejects an empty days array', () => {
        expect(() =>
            validateRequestSchema(
                // @ts-ignore
                { ...DAYS_PARAMS, days: [] },
                { schema: trafficAreaAnalyticsRequestSchema },
            ),
        ).toThrow();
    });

    test('rejects days strings not in YYYY-MM-DD format', () => {
        expect(() =>
            validateRequestSchema(
                // @ts-ignore
                { ...DAYS_PARAMS, days: ['08/05/2024'] },
                { schema: trafficAreaAnalyticsRequestSchema },
            ),
        ).toThrow();
    });
});

describe('Traffic Area Analytics schema — date validation', () => {
    test('fails when endDate is before startDate', () => {
        const result = trafficAreaAnalyticsRequestSchema.safeParse({
            ...VALID_PARAMS,
            startDate: new Date('2024-08-10'),
            endDate: new Date('2024-08-06'),
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toContain('31 days');
        }
    });

    test('fails when date range exceeds 31 days', () => {
        const result = trafficAreaAnalyticsRequestSchema.safeParse({
            ...VALID_PARAMS,
            startDate: new Date('2024-08-01'),
            endDate: new Date('2024-09-15'),
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toContain('31 days');
        }
    });

    test('fails when date range exceeds 31 days using string dates', () => {
        const result = trafficAreaAnalyticsRequestSchema.safeParse({
            ...VALID_PARAMS,
            startDate: '2024-08-01',
            endDate: '2024-09-15',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toContain('31 days');
        }
    });

    test('fails when startDate equals endDate', () => {
        const result = trafficAreaAnalyticsRequestSchema.safeParse({
            ...VALID_PARAMS,
            startDate: new Date('2024-08-06'),
            endDate: new Date('2024-08-06'),
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toContain('31 days');
        }
    });

    test('fails when endDate is less than 2 days before today', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        const result = trafficAreaAnalyticsRequestSchema.safeParse({
            ...VALID_PARAMS,
            startDate: twoDaysAgo,
            endDate: yesterday,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toContain('2 days before today');
        }
    });

    test('fails when a day in the days array is less than 2 days before today', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const result = trafficAreaAnalyticsRequestSchema.safeParse({
            ...VALID_PARAMS,
            startDate: undefined,
            endDate: undefined,
            days: [yesterday],
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toContain('2 days before today');
        }
    });
});

describe('Traffic Area Analytics schema — metrics validation', () => {
    test("accepts metrics: 'all'", () => {
        expect(() =>
            validateRequestSchema({ ...VALID_PARAMS, metrics: 'all' }, { schema: trafficAreaAnalyticsRequestSchema }),
        ).not.toThrow();
    });

    test('fails when metrics is empty', () => {
        expect(() =>
            validateRequestSchema(
                // @ts-ignore
                { ...VALID_PARAMS, metrics: [] },
                { schema: trafficAreaAnalyticsRequestSchema },
            ),
        ).toThrow();
    });

    test('fails when metrics contains invalid enum values', () => {
        expect(() =>
            validateRequestSchema(
                // @ts-ignore
                { ...VALID_PARAMS, metrics: ['INVALID_TYPE'] },
                { schema: trafficAreaAnalyticsRequestSchema },
            ),
        ).toThrow();
    });
});

describe('Traffic Area Analytics schema — functionalRoadClasses validation', () => {
    test('fails when functionalRoadClasses is an empty array', () => {
        expect(() =>
            validateRequestSchema(
                // @ts-ignore
                { ...VALID_PARAMS, functionalRoadClasses: [] },
                { schema: trafficAreaAnalyticsRequestSchema },
            ),
        ).toThrow();
    });

    test('fails when functionalRoadClasses contains an invalid string', () => {
        expect(() =>
            validateRequestSchema(
                // @ts-ignore
                { ...VALID_PARAMS, functionalRoadClasses: ['INVALID_FRC'] },
                { schema: trafficAreaAnalyticsRequestSchema },
            ),
        ).toThrow();
    });
});

describe('Traffic Area Analytics schema — hours validation', () => {
    test('fails when hours is empty', () => {
        expect(() =>
            validateRequestSchema(
                // @ts-ignore
                { ...VALID_PARAMS, hours: [] },
                { schema: trafficAreaAnalyticsRequestSchema },
            ),
        ).toThrow();
    });

    test('fails when hours contains a value above 23', () => {
        expect(() =>
            validateRequestSchema(
                // @ts-ignore
                { ...VALID_PARAMS, hours: [24] },
                { schema: trafficAreaAnalyticsRequestSchema },
            ),
        ).toThrow();
    });

    test('fails when hours contains a negative value', () => {
        expect(() =>
            validateRequestSchema(
                // @ts-ignore
                { ...VALID_PARAMS, hours: [-1, 0, 7] },
                { schema: trafficAreaAnalyticsRequestSchema },
            ),
        ).toThrow();
    });
});

describe('Traffic Area Analytics schema — feature validation', () => {
    test('fails when geometry type is not Polygon or MultiPolygon', () => {
        expect(() =>
            validateRequestSchema(
                {
                    ...VALID_PARAMS,
                    // @ts-ignore
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [4.9, 52.3],
                            [4.91, 52.31],
                        ],
                    },
                },
                { schema: trafficAreaAnalyticsRequestSchema },
            ),
        ).toThrow();
    });

    test('fails when coordinates are empty', () => {
        expect(() =>
            validateRequestSchema(
                {
                    ...VALID_PARAMS,
                    // @ts-ignore
                    geometry: { type: 'Polygon', coordinates: [] },
                },
                { schema: trafficAreaAnalyticsRequestSchema },
            ),
        ).toThrow();
    });
});

describe('Traffic Area Analytics schema — performance tests', () => {
    test('schema validation completes within time limit', () => {
        expect(
            bestExecutionTimeMS(
                () => validateRequestSchema(VALID_PARAMS, { schema: trafficAreaAnalyticsRequestSchema }),
                10,
            ),
        ).toBeLessThan(MAX_EXEC_TIMES_MS.trafficAreaAnalytics.schemaValidation);
    });
});
