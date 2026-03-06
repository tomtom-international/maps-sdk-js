import type { AreaAnalyticsDataType, TrafficAreaAnalytics } from '@tomtom-org/maps-sdk/core';
import type { AreaAnalyticsResponseAPI } from '../types/apiTypes';

type TestCase = [name: string, apiResponse: AreaAnalyticsResponseAPI, expected: TrafficAreaAnalytics];

const POLYGON_COORDS = [
    [
        [4.896128, 52.382402],
        [4.875701, 52.368459],
        [4.923611, 52.36341],
        [4.896128, 52.382402],
    ],
];

const BASE_COLLECTION_PROPS_API = {
    startDate: '2024-08-06',
    endDate: '2024-08-06',
    dataTypes: ['SPEED', 'CONGESTION_LEVEL'],
    heatmap: false,
    frcs: [0, 1, 2],
};

const BASE_COLLECTION_PROPS_SDK = {
    startDate: new Date('2024-08-06'),
    endDate: new Date('2024-08-06'),
    dataTypes: ['SPEED', 'CONGESTION_LEVEL'] as AreaAnalyticsDataType[],
    heatmap: false,
    frcs: [0, 1, 2],
};

export const apiAndParsedResponses: TestCase[] = [
    [
        'empty features list',
        {
            type: 'FeatureCollection',
            properties: BASE_COLLECTION_PROPS_API,
            features: [],
        },
        {
            type: 'FeatureCollection',
            properties: BASE_COLLECTION_PROPS_SDK,
            features: [],
        },
    ],
    [
        'single feature — renames abbreviated metric fields',
        {
            type: 'FeatureCollection',
            properties: {
                ...BASE_COLLECTION_PROPS_API,
                dataTypes: ['SPEED', 'FREE_FLOW_SPEED', 'CONGESTION_LEVEL', 'TRAVEL_TIME', 'NETWORK_LENGTH'],
            },
            features: [
                {
                    type: 'Feature',
                    id: 'feat-001',
                    geometry: { type: 'Polygon', coordinates: POLYGON_COORDS },
                    properties: {
                        name: 'Amsterdam',
                        timezone: 'Europe/Amsterdam',
                        level: 0,
                        baseData: { v: 45.2, fv: 60.1, c: 18.5, t: 13.3, l: 125000 },
                        timedData: {},
                    },
                },
            ],
        },
        {
            type: 'FeatureCollection',
            properties: {
                ...BASE_COLLECTION_PROPS_SDK,
                dataTypes: ['SPEED', 'FREE_FLOW_SPEED', 'CONGESTION_LEVEL', 'TRAVEL_TIME', 'NETWORK_LENGTH'],
            },
            features: [
                {
                    type: 'Feature',
                    id: 'feat-001',
                    geometry: { type: 'Polygon', coordinates: POLYGON_COORDS },
                    properties: {
                        name: 'Amsterdam',
                        timezone: 'Europe/Amsterdam',
                        level: 0,
                        baseData: {
                            speed: 45.2,
                            freeFlowSpeed: 60.1,
                            congestionLevel: 18.5,
                            travelTime: 13.3,
                            networkLength: 125000,
                        },
                        timedData: {},
                    },
                },
            ],
        },
    ],
    [
        'feature with daily timedData — date strings become Date objects',
        {
            type: 'FeatureCollection',
            properties: BASE_COLLECTION_PROPS_API,
            features: [
                {
                    type: 'Feature',
                    id: 'feat-002',
                    geometry: { type: 'Polygon', coordinates: POLYGON_COORDS },
                    properties: {
                        name: 'Rotterdam',
                        timezone: 'Europe/Amsterdam',
                        level: 0,
                        baseData: { v: 50.0, c: 10.0 },
                        timedData: {
                            daily: [
                                { date: '2024-08-06', v: 48.3, c: 12.1 },
                                { date: '2024-08-07', v: 52.1, c: 8.4 },
                            ],
                        },
                    },
                },
            ],
        },
        {
            type: 'FeatureCollection',
            properties: BASE_COLLECTION_PROPS_SDK,
            features: [
                {
                    type: 'Feature',
                    id: 'feat-002',
                    geometry: { type: 'Polygon', coordinates: POLYGON_COORDS },
                    properties: {
                        name: 'Rotterdam',
                        timezone: 'Europe/Amsterdam',
                        level: 0,
                        baseData: { speed: 50.0, congestionLevel: 10.0 },
                        timedData: {
                            daily: [
                                { date: new Date('2024-08-06'), speed: 48.3, congestionLevel: 12.1 },
                                { date: new Date('2024-08-07'), speed: 52.1, congestionLevel: 8.4 },
                            ],
                        },
                    },
                },
            ],
        },
    ],
    [
        'feature with hourly timedData',
        {
            type: 'FeatureCollection',
            properties: BASE_COLLECTION_PROPS_API,
            features: [
                {
                    type: 'Feature',
                    id: 'feat-003',
                    geometry: { type: 'Polygon', coordinates: POLYGON_COORDS },
                    properties: {
                        name: 'Utrecht',
                        timezone: 'Europe/Amsterdam',
                        level: 0,
                        baseData: { v: 42.0 },
                        timedData: {
                            hourly: [
                                { date: '2024-08-06', hour: 7, v: 35.0 },
                                { date: '2024-08-06', hour: 8, v: 30.5 },
                            ],
                        },
                    },
                },
            ],
        },
        {
            type: 'FeatureCollection',
            properties: BASE_COLLECTION_PROPS_SDK,
            features: [
                {
                    type: 'Feature',
                    id: 'feat-003',
                    geometry: { type: 'Polygon', coordinates: POLYGON_COORDS },
                    properties: {
                        name: 'Utrecht',
                        timezone: 'Europe/Amsterdam',
                        level: 0,
                        baseData: { speed: 42.0 },
                        timedData: {
                            hourly: [
                                { date: new Date('2024-08-06'), hour: 7, speed: 35.0 },
                                { date: new Date('2024-08-06'), hour: 8, speed: 30.5 },
                            ],
                        },
                    },
                },
            ],
        },
    ],
    [
        'feature with tiledData and anomalies — anomaly dates become Date objects',
        {
            type: 'FeatureCollection',
            properties: BASE_COLLECTION_PROPS_API,
            features: [
                {
                    type: 'Feature',
                    id: 'feat-004',
                    geometry: { type: 'Polygon', coordinates: POLYGON_COORDS },
                    properties: {
                        name: 'The Hague',
                        timezone: 'Europe/Amsterdam',
                        level: 0,
                        baseData: { v: 55.0, c: 5.0 },
                        timedData: {},
                        tiledData: {
                            tiles: [
                                { lat: 52.07, lon: 4.3, v: 60.0, c: 2.0 },
                                { lat: 52.08, lon: 4.31, v: 50.0, c: 8.0 },
                            ],
                        },
                        anomalies: {
                            SPEED: [{ startDate: '2024-08-06', endDate: '2024-08-06', labels: ['Holiday'] }],
                        },
                    },
                },
            ],
        },
        {
            type: 'FeatureCollection',
            properties: BASE_COLLECTION_PROPS_SDK,
            features: [
                {
                    type: 'Feature',
                    id: 'feat-004',
                    geometry: { type: 'Polygon', coordinates: POLYGON_COORDS },
                    properties: {
                        name: 'The Hague',
                        timezone: 'Europe/Amsterdam',
                        level: 0,
                        baseData: { speed: 55.0, congestionLevel: 5.0 },
                        timedData: {},
                        tiledData: {
                            tiles: [
                                { tileCentre: [4.3, 52.07], speed: 60.0, congestionLevel: 2.0 },
                                { tileCentre: [4.31, 52.08], speed: 50.0, congestionLevel: 8.0 },
                            ],
                        },
                        anomalies: {
                            SPEED: [
                                {
                                    startDate: new Date('2024-08-06'),
                                    endDate: new Date('2024-08-06'),
                                    labels: ['Holiday'],
                                },
                            ],
                        },
                    },
                },
            ],
        },
    ],
    [
        'feature with all timedData granularities',
        {
            type: 'FeatureCollection',
            properties: BASE_COLLECTION_PROPS_API,
            features: [
                {
                    type: 'Feature',
                    id: 'feat-005',
                    geometry: { type: 'Polygon', coordinates: POLYGON_COORDS },
                    properties: {
                        name: 'Eindhoven',
                        timezone: 'Europe/Amsterdam',
                        level: 0,
                        baseData: { v: 48.0 },
                        timedData: {
                            yearly: [{ year: 2024, v: 48.0 }],
                            monthly: [{ year: 2024, month: 8, v: 47.5 }],
                            weekly: [{ year: 2024, week: 32, v: 46.0 }],
                            daily: [{ date: '2024-08-06', v: 45.0 }],
                            hourly: [{ date: '2024-08-06', hour: 8, v: 40.0 }],
                            average: [{ day: 2, hour: 8, v: 41.0 }],
                        },
                    },
                },
            ],
        },
        {
            type: 'FeatureCollection',
            properties: BASE_COLLECTION_PROPS_SDK,
            features: [
                {
                    type: 'Feature',
                    id: 'feat-005',
                    geometry: { type: 'Polygon', coordinates: POLYGON_COORDS },
                    properties: {
                        name: 'Eindhoven',
                        timezone: 'Europe/Amsterdam',
                        level: 0,
                        baseData: { speed: 48.0 },
                        timedData: {
                            yearly: [{ year: 2024, speed: 48.0 }],
                            monthly: [{ year: 2024, month: 8, speed: 47.5 }],
                            weekly: [{ year: 2024, week: 32, speed: 46.0 }],
                            daily: [{ date: new Date('2024-08-06'), speed: 45.0 }],
                            hourly: [{ date: new Date('2024-08-06'), hour: 8, speed: 40.0 }],
                            average: [{ day: 2, hour: 8, speed: 41.0 }],
                        },
                    },
                },
            ],
        },
    ],
];
