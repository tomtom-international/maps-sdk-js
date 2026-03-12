import { describe, expect, test } from 'vitest';
import { bestExecutionTimeMS } from '../../../../core/src/util/tests/performanceTestUtils';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { buildTrafficAreaAnalyticsRequest } from '../requestBuilder';
import type { AreaAnalyticsDataType, FunctionalRoadClass } from '../types/trafficAreaAnalyticsParams';

const BASE = 'https://api-test.tomtom.com';
const KEY = 'TEST_API_KEY';
const COMMON = { apiKey: KEY, apiVersion: 1, commonBaseURL: BASE } as const;

const AMSTERDAM_POLYGON = {
    type: 'Polygon' as const,
    coordinates: [
        [
            [4.896128, 52.382402],
            [4.875701, 52.368459],
            [4.923611, 52.36341],
            [4.896128, 52.382402],
        ],
    ],
};

const AMSTERDAM_MULTI_POLYGON = {
    type: 'MultiPolygon' as const,
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

const BASE_PARAMS = {
    ...COMMON,
    startDate: new Date('2024-08-06'),
    endDate: new Date('2024-08-06'),
    dataTypes: ['SPEED', 'CONGESTION_LEVEL'] as AreaAnalyticsDataType[],
    functionalRoadClasses: ['MOTORWAY', 'MAJOR_ROAD', 'OTHER_MAJOR_ROAD'] as FunctionalRoadClass[],
    hours: [7, 8, 17, 18],
    geometry: AMSTERDAM_POLYGON,
};

describe('buildTrafficAreaAnalyticsRequest — POST method', () => {
    test('always builds a POST request', () => {
        const result = buildTrafficAreaAnalyticsRequest(BASE_PARAMS);
        expect(result.method).toBe('POST');
    });

    test('builds the correct URL path', () => {
        const result = buildTrafficAreaAnalyticsRequest(BASE_PARAMS);
        expect(result.url.toString()).toContain(`${BASE}/areaanalytics/reports/lite`);
    });

    test('appends key and apiVersion to URL query string', () => {
        const result = buildTrafficAreaAnalyticsRequest(BASE_PARAMS);
        const url = result.url.toString();
        expect(url).toContain(`key=${KEY}`);
        expect(url).toContain('apiVersion=1');
    });
});

describe('buildTrafficAreaAnalyticsRequest — request body', () => {
    test('serializes Date objects to YYYY-MM-DD strings in body', () => {
        const result = buildTrafficAreaAnalyticsRequest(BASE_PARAMS);
        const body = (result as { data: Record<string, unknown> }).data;

        expect(body.startDate).toBe('2024-08-06');
        expect(body.endDate).toBe('2024-08-06');
        expect(typeof body.startDate).toBe('string');
        expect(typeof body.endDate).toBe('string');
    });

    test('passes YYYY-MM-DD strings through unchanged', () => {
        const result = buildTrafficAreaAnalyticsRequest({
            ...BASE_PARAMS,
            startDate: '2024-08-01',
            endDate: '2024-08-07',
        });
        const body = (result as { data: Record<string, unknown> }).data;

        expect(body.startDate).toBe('2024-08-01');
        expect(body.endDate).toBe('2024-08-07');
    });

    test('defaults endDate to today when omitted', () => {
        const today = new Date().toISOString().slice(0, 10);
        const result = buildTrafficAreaAnalyticsRequest({
            ...BASE_PARAMS,
            startDate: '2024-08-01',
            endDate: undefined,
        });
        const body = (result as { data: Record<string, unknown> }).data;

        expect(body.startDate).toBe('2024-08-01');
        expect(body.endDate).toBe(today);
    });

    test('includes required fields in body', () => {
        const result = buildTrafficAreaAnalyticsRequest(BASE_PARAMS);
        const body = (result as { data: Record<string, unknown> }).data;

        expect(body.startDate).toBe('2024-08-06');
        expect(body.endDate).toBe('2024-08-06');
        expect(body.dataTypes).toEqual(['SPEED', 'CONGESTION_LEVEL']);
        expect(body.frcs).toEqual([0, 1, 2]);
        expect(body.hours).toEqual([7, 8, 17, 18]);
    });

    test("expands hours 'all' to [0..23]", () => {
        const result = buildTrafficAreaAnalyticsRequest({ ...BASE_PARAMS, hours: 'all' });
        const body = (result as { data: Record<string, unknown> }).data;
        expect(body.hours).toEqual(Array.from({ length: 24 }, (_, i) => i));
    });

    test('wraps geometry into a single-element features array', () => {
        const result = buildTrafficAreaAnalyticsRequest(BASE_PARAMS);
        const body = (result as { data: Record<string, unknown> }).data;
        const features = body.features as Array<{ type: string; geometry: unknown }>;

        expect(features).toHaveLength(1);
        expect(features[0].type).toBe('Feature');
        expect(features[0].geometry).toEqual(AMSTERDAM_POLYGON);
    });

    test('includes optional report name when provided', () => {
        const result = buildTrafficAreaAnalyticsRequest({ ...BASE_PARAMS, name: 'My Report' });
        const body = (result as { data: Record<string, unknown> }).data;
        expect(body.name).toBe('My Report');
    });

    test('omits name field when not provided', () => {
        const result = buildTrafficAreaAnalyticsRequest(BASE_PARAMS);
        const body = (result as { data: Record<string, unknown> }).data;
        expect(body.name).toContain('Maps SDK JS Area Analytics Report 2');
    });
});

describe('buildTrafficAreaAnalyticsRequest — functionalRoadClasses', () => {
    test('maps FRC string values to numeric indices', () => {
        const result = buildTrafficAreaAnalyticsRequest(BASE_PARAMS);
        const body = (result as { data: Record<string, unknown> }).data;
        // MOTORWAY=0, MAJOR_ROAD=1, OTHER_MAJOR_ROAD=2
        expect(body.frcs).toEqual([0, 1, 2]);
    });

    test("expands functionalRoadClasses 'all' to [0..8]", () => {
        const result = buildTrafficAreaAnalyticsRequest({ ...BASE_PARAMS, functionalRoadClasses: 'all' });
        const body = (result as { data: Record<string, unknown> }).data;
        expect(body.frcs).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    });

    test('correctly maps each FRC to its numeric index', () => {
        const allFRCs: FunctionalRoadClass[] = [
            'MOTORWAY',
            'MAJOR_ROAD',
            'OTHER_MAJOR_ROAD',
            'SECONDARY_ROAD',
            'LOCAL_CONNECTING_ROAD',
            'LOCAL_ROAD_HIGH_IMPORTANCE',
            'LOCAL_ROAD',
            'LOCAL_ROAD_MINOR_IMPORTANCE',
            'OTHER_ROAD',
        ];
        const result = buildTrafficAreaAnalyticsRequest({ ...BASE_PARAMS, functionalRoadClasses: allFRCs });
        const body = (result as { data: Record<string, unknown> }).data;
        expect(body.frcs).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    });
});

describe('buildTrafficAreaAnalyticsRequest — days field', () => {
    const DAYS_PARAMS = {
        ...COMMON,
        days: ['2024-08-05', '2024-08-12', '2024-08-19', '2024-08-26'],
        dataTypes: ['SPEED'] as AreaAnalyticsDataType[],
        functionalRoadClasses: ['MOTORWAY', 'MAJOR_ROAD', 'OTHER_MAJOR_ROAD'] as FunctionalRoadClass[],
        hours: [8, 9],
        geometry: AMSTERDAM_POLYGON,
    };

    test('serializes days strings into the body', () => {
        const result = buildTrafficAreaAnalyticsRequest(DAYS_PARAMS);
        const body = (result as { data: Record<string, unknown> }).data;

        expect(body.days).toEqual(['2024-08-05', '2024-08-12', '2024-08-19', '2024-08-26']);
        expect(body.startDate).toBeUndefined();
        expect(body.endDate).toBeUndefined();
    });

    test('serializes Date objects in days array to YYYY-MM-DD strings', () => {
        const result = buildTrafficAreaAnalyticsRequest({
            ...DAYS_PARAMS,
            days: [new Date('2024-08-05'), new Date('2024-08-12')],
        });
        const body = (result as { data: Record<string, unknown> }).data;

        expect(body.days).toEqual(['2024-08-05', '2024-08-12']);
    });

    test('omits startDate and endDate when days is used', () => {
        const result = buildTrafficAreaAnalyticsRequest(DAYS_PARAMS);
        const body = (result as { data: Record<string, unknown> }).data;

        expect(body.startDate).toBeUndefined();
        expect(body.endDate).toBeUndefined();
    });
});

describe('buildTrafficAreaAnalyticsRequest — MultiPolygon geometry', () => {
    test('passes MultiPolygon geometry through to the request body', () => {
        const result = buildTrafficAreaAnalyticsRequest({
            ...BASE_PARAMS,
            geometry: AMSTERDAM_MULTI_POLYGON,
        });

        const body = (result as { data: Record<string, unknown> }).data;
        const features = body.features as Array<{ geometry: { type: string } }>;
        expect(features[0].geometry.type).toBe('MultiPolygon');
        expect(features[0].geometry).toEqual(AMSTERDAM_MULTI_POLYGON);
    });
});

describe('buildTrafficAreaAnalyticsRequest — custom base URL', () => {
    test('uses customServiceBaseURL when provided', () => {
        const result = buildTrafficAreaAnalyticsRequest({
            ...BASE_PARAMS,
            customServiceBaseURL: 'https://custom.example.com/areaanalytics/reports/lite',
        });

        expect(result.url.toString()).toContain('https://custom.example.com/areaanalytics/reports/lite');
    });
});

describe('buildTrafficAreaAnalyticsRequest — performance', () => {
    test('builds request within time budget', () => {
        expect(bestExecutionTimeMS(() => buildTrafficAreaAnalyticsRequest(BASE_PARAMS), 10)).toBeLessThan(
            MAX_EXEC_TIMES_MS.trafficAreaAnalytics.requestBuilding,
        );
    });
});
