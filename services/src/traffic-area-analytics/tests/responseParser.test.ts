import { describe, expect, test } from 'vitest';
import { bestExecutionTimeMS } from '../../../../core/src/util/tests/performanceTestUtils';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { parseTrafficAreaAnalyticsResponse } from '../responseParser';
import { apiAndParsedResponses } from './responseParser.data';

describe('parseTrafficAreaAnalyticsResponse', () => {
    test.each(apiAndParsedResponses)('%s', (_name, apiResponse, expected) => {
        expect(parseTrafficAreaAnalyticsResponse(apiResponse)).toMatchObject(expected);
    });

    test('converts collection startDate and endDate strings to Date objects', () => {
        const result = parseTrafficAreaAnalyticsResponse({
            type: 'FeatureCollection',
            properties: {
                startDate: '2024-08-01',
                endDate: '2024-08-07',
                dataTypes: ['SPEED'],
                heatmap: false,
                frcs: [0],
            },
            features: [],
        });

        expect(result.properties.startDate).toBeInstanceOf(Date);
        expect(result.properties.endDate).toBeInstanceOf(Date);
        expect(result.properties.startDate.toISOString()).toBe('2024-08-01T00:00:00.000Z');
        expect(result.properties.endDate.toISOString()).toBe('2024-08-07T00:00:00.000Z');
    });

    test('converts timedData daily date strings to Date objects', () => {
        const result = parseTrafficAreaAnalyticsResponse({
            type: 'FeatureCollection',
            properties: {
                startDate: '2024-08-06',
                endDate: '2024-08-07',
                dataTypes: ['SPEED'],
                heatmap: false,
                frcs: [0],
            },
            features: [
                {
                    type: 'Feature',
                    id: 'date-test',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [4.9, 52.3],
                                [4.91, 52.3],
                                [4.91, 52.31],
                                [4.9, 52.3],
                            ],
                        ],
                    },
                    properties: {
                        name: 'Test',
                        timezone: 'UTC',
                        level: 0,
                        baseData: {},
                        timedData: {
                            daily: [
                                { date: '2024-08-06', v: 50 },
                                { date: '2024-08-07', v: 55 },
                            ],
                            hourly: [{ date: '2024-08-06', hour: 8, v: 40 }],
                        },
                    },
                },
            ],
        });

        const { daily, hourly } = result.features[0].properties.timedData;
        expect(daily?.[0].date).toBeInstanceOf(Date);
        expect(daily?.[1].date).toBeInstanceOf(Date);
        expect(hourly?.[0].date).toBeInstanceOf(Date);
    });

    test('converts anomaly date strings to Date objects', () => {
        const result = parseTrafficAreaAnalyticsResponse({
            type: 'FeatureCollection',
            properties: {
                startDate: '2024-08-06',
                endDate: '2024-08-06',
                dataTypes: ['SPEED'],
                heatmap: false,
                frcs: [0],
            },
            features: [
                {
                    type: 'Feature',
                    id: 'anomaly-test',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [4.9, 52.3],
                                [4.91, 52.3],
                                [4.91, 52.31],
                                [4.9, 52.3],
                            ],
                        ],
                    },
                    properties: {
                        name: 'Test',
                        timezone: 'UTC',
                        level: 0,
                        baseData: {},
                        timedData: {},
                        anomalies: {
                            SPEED: [{ startDate: '2024-08-05', endDate: '2024-08-06', labels: ['Holiday'] }],
                        },
                    },
                },
            ],
        });

        const anomalies = result.features[0].properties.anomalies?.SPEED;
        expect(anomalies?.[0].startDate).toBeInstanceOf(Date);
        expect(anomalies?.[0].endDate).toBeInstanceOf(Date);
    });

    test('omits metric fields that are absent in API response', () => {
        const result = parseTrafficAreaAnalyticsResponse({
            type: 'FeatureCollection',
            properties: {
                startDate: '2024-08-06',
                endDate: '2024-08-06',
                dataTypes: ['SPEED'],
                heatmap: false,
                frcs: [0],
            },
            features: [
                {
                    type: 'Feature',
                    id: 'minimal',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [4.9, 52.3],
                                [4.91, 52.3],
                                [4.91, 52.31],
                                [4.9, 52.31],
                                [4.9, 52.3],
                            ],
                        ],
                    },
                    properties: {
                        name: 'Test',
                        timezone: 'Europe/Amsterdam',
                        level: 0,
                        baseData: { v: 50.0 },
                        timedData: {},
                    },
                },
            ],
        });

        const { baseData } = result.features[0].properties;
        expect(baseData.speed).toBe(50.0);
        expect(baseData.freeFlowSpeed).toBeUndefined();
        expect(baseData.congestionLevel).toBeUndefined();
        expect(baseData.travelTime).toBeUndefined();
        expect(baseData.networkLength).toBeUndefined();
    });

    test('omits tiledData and anomalies when absent in API response', () => {
        const result = parseTrafficAreaAnalyticsResponse({
            type: 'FeatureCollection',
            properties: {
                startDate: '2024-08-06',
                endDate: '2024-08-06',
                dataTypes: ['SPEED'],
                heatmap: false,
                frcs: [0],
            },
            features: [
                {
                    type: 'Feature',
                    id: 'no-tiles',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [4.9, 52.3],
                                [4.91, 52.3],
                                [4.91, 52.31],
                                [4.9, 52.3],
                            ],
                        ],
                    },
                    properties: {
                        name: 'Test',
                        timezone: 'UTC',
                        level: 0,
                        baseData: {},
                        timedData: {},
                    },
                },
            ],
        });

        expect(result.features[0].properties.tiledData).toBeUndefined();
        expect(result.features[0].properties.anomalies).toBeUndefined();
    });

    test('computes date and hour for hourly entries without temporal fields', () => {
        const result = parseTrafficAreaAnalyticsResponse({
            type: 'FeatureCollection',
            properties: {
                startDate: '2024-08-06',
                endDate: '2024-08-07',
                dataTypes: ['SPEED'],
                heatmap: false,
                frcs: [0],
            },
            features: [
                {
                    type: 'Feature',
                    id: 'hourly-test',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [4.9, 52.3],
                                [4.91, 52.3],
                                [4.91, 52.31],
                                [4.9, 52.3],
                            ],
                        ],
                    },
                    properties: {
                        name: 'Test',
                        timezone: 'UTC',
                        level: 0,
                        baseData: {},
                        timedData: {
                            // 48 entries (2 days × 24 hours) with NO date/hour fields
                            hourly: Array.from({ length: 48 }, (_, i) => ({ v: 30 + i })),
                        },
                    },
                },
            ],
        });

        const { hourly } = result.features[0].properties.timedData;
        expect(hourly).toHaveLength(48);
        // First entry: day 0, hour 0
        expect(hourly?.[0].date).toBeInstanceOf(Date);
        expect(hourly?.[0].date?.toISOString()).toBe('2024-08-06T00:00:00.000Z');
        expect(hourly?.[0].hour).toBe(0);
        // Entry 7: day 0, hour 7
        expect(hourly?.[7].hour).toBe(7);
        // Entry 24: day 1, hour 0
        expect(hourly?.[24].date?.toISOString()).toBe('2024-08-07T00:00:00.000Z');
        expect(hourly?.[24].hour).toBe(0);
        // Entry 47: day 1, hour 23
        expect(hourly?.[47].hour).toBe(23);
        expect(hourly?.[47].speed).toBe(77);
    });

    test('computes day and hour for average entries without temporal fields', () => {
        const result = parseTrafficAreaAnalyticsResponse({
            type: 'FeatureCollection',
            properties: {
                startDate: '2024-08-06',
                endDate: '2024-08-12',
                dataTypes: ['CONGESTION_LEVEL'],
                heatmap: false,
                frcs: [0],
            },
            features: [
                {
                    type: 'Feature',
                    id: 'average-test',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [4.9, 52.3],
                                [4.91, 52.3],
                                [4.91, 52.31],
                                [4.9, 52.3],
                            ],
                        ],
                    },
                    properties: {
                        name: 'Test',
                        timezone: 'UTC',
                        level: 0,
                        baseData: {},
                        timedData: {
                            // 168 entries (7 × 24) with NO day/hour fields
                            average: Array.from({ length: 168 }, (_, i) => ({ c: i })),
                        },
                    },
                },
            ],
        });

        const { average } = result.features[0].properties.timedData;
        expect(average).toHaveLength(168);
        // First entry: day 1 (Monday), hour 0
        expect(average?.[0].day).toBe(1);
        expect(average?.[0].hour).toBe(0);
        // Entry 23: day 1, hour 23
        expect(average?.[23].day).toBe(1);
        expect(average?.[23].hour).toBe(23);
        // Entry 24: day 2 (Tuesday), hour 0
        expect(average?.[24].day).toBe(2);
        expect(average?.[24].hour).toBe(0);
        // Last entry (167): day 7 (Sunday), hour 23
        expect(average?.[167].day).toBe(7);
        expect(average?.[167].hour).toBe(23);
    });

    test('computes date for daily entries without date field', () => {
        const result = parseTrafficAreaAnalyticsResponse({
            type: 'FeatureCollection',
            properties: {
                startDate: '2024-08-06',
                endDate: '2024-08-08',
                dataTypes: ['SPEED'],
                heatmap: false,
                frcs: [0],
            },
            features: [
                {
                    type: 'Feature',
                    id: 'daily-test',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [4.9, 52.3],
                                [4.91, 52.3],
                                [4.91, 52.31],
                                [4.9, 52.3],
                            ],
                        ],
                    },
                    properties: {
                        name: 'Test',
                        timezone: 'UTC',
                        level: 0,
                        baseData: {},
                        timedData: {
                            daily: [{ v: 40 }, { v: 45 }, { v: 50 }],
                        },
                    },
                },
            ],
        });

        const { daily } = result.features[0].properties.timedData;
        expect(daily).toHaveLength(3);
        expect(daily?.[0].date?.toISOString()).toBe('2024-08-06T00:00:00.000Z');
        expect(daily?.[1].date?.toISOString()).toBe('2024-08-07T00:00:00.000Z');
        expect(daily?.[2].date?.toISOString()).toBe('2024-08-08T00:00:00.000Z');
    });

    test('preserves API-provided temporal fields when present', () => {
        const result = parseTrafficAreaAnalyticsResponse({
            type: 'FeatureCollection',
            properties: {
                startDate: '2024-08-06',
                endDate: '2024-08-06',
                dataTypes: ['SPEED'],
                heatmap: false,
                frcs: [0],
            },
            features: [
                {
                    type: 'Feature',
                    id: 'preserve-test',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [4.9, 52.3],
                                [4.91, 52.3],
                                [4.91, 52.31],
                                [4.9, 52.3],
                            ],
                        ],
                    },
                    properties: {
                        name: 'Test',
                        timezone: 'UTC',
                        level: 0,
                        baseData: {},
                        timedData: {
                            hourly: [{ date: '2024-08-06', hour: 8, v: 40 }],
                            average: [{ day: 3, hour: 14, c: 25 }],
                        },
                    },
                },
            ],
        });

        const { hourly, average } = result.features[0].properties.timedData;
        // Hourly: API-provided date/hour should be preserved
        expect(hourly?.[0].date?.toISOString()).toBe('2024-08-06T00:00:00.000Z');
        expect(hourly?.[0].hour).toBe(8);
        // Average: API-provided day/hour should be preserved
        expect(average?.[0].day).toBe(3);
        expect(average?.[0].hour).toBe(14);
    });

    test('preserves feature id and polygon geometry', () => {
        const coords = [
            [
                [4.896128, 52.382402],
                [4.875701, 52.368459],
                [4.923611, 52.36341],
                [4.896128, 52.382402],
            ],
        ];
        const result = parseTrafficAreaAnalyticsResponse({
            type: 'FeatureCollection',
            properties: {
                startDate: '2024-08-06',
                endDate: '2024-08-06',
                dataTypes: ['SPEED'],
                heatmap: false,
                frcs: [0],
            },
            features: [
                {
                    type: 'Feature',
                    id: 'my-region-uuid',
                    geometry: { type: 'Polygon', coordinates: coords },
                    properties: {
                        name: 'Test',
                        timezone: 'Europe/Amsterdam',
                        level: 0,
                        baseData: {},
                        timedData: {},
                    },
                },
            ],
        });

        expect(result.features[0].id).toBe('my-region-uuid');
        expect(result.features[0].geometry).toEqual({ type: 'Polygon', coordinates: coords });
    });
});

describe('parseTrafficAreaAnalyticsResponse — performance', () => {
    test('parses within time budget', () => {
        const largeResponse = {
            type: 'FeatureCollection' as const,
            properties: {
                startDate: '2024-08-01',
                endDate: '2024-08-31',
                dataTypes: ['SPEED', 'CONGESTION_LEVEL', 'FREE_FLOW_SPEED', 'TRAVEL_TIME', 'NETWORK_LENGTH'],
                heatmap: false,
                frcs: [0, 1, 2, 3, 4, 5],
            },
            features: Array.from({ length: 10 }, (_, i) => ({
                type: 'Feature' as const,
                id: `feat-${i}`,
                geometry: {
                    type: 'Polygon' as const,
                    coordinates: [
                        [
                            [4.9 + i * 0.01, 52.3],
                            [4.91 + i * 0.01, 52.3],
                            [4.91 + i * 0.01, 52.31],
                            [4.9 + i * 0.01, 52.3],
                        ],
                    ],
                },
                properties: {
                    name: `Region ${i}`,
                    timezone: 'Europe/Amsterdam',
                    level: 0,
                    baseData: { v: 50 + i, fv: 70 + i, c: 10 + i, t: 12 + i, l: 100000 + i * 1000 },
                    timedData: {
                        daily: Array.from({ length: 31 }, (_, d) => ({
                            date: `2024-08-${String(d + 1).padStart(2, '0')}`,
                            v: 50 + d,
                            c: 10 + d,
                        })),
                        hourly: Array.from({ length: 24 }, (_, h) => ({
                            date: '2024-08-01',
                            hour: h,
                            v: 40 + h,
                        })),
                    },
                },
            })),
        };

        expect(bestExecutionTimeMS(() => parseTrafficAreaAnalyticsResponse(largeResponse), 10)).toBeLessThan(
            MAX_EXEC_TIMES_MS.trafficAreaAnalytics.responseParsing,
        );
    });
});
