import type { TrafficIncidentDetails } from '@tomtom-org/maps-sdk/core';
import type { IncidentDetailsResponseAPI } from '../types/apiTypes';

type TestCase = [name: string, apiResponse: IncidentDetailsResponseAPI, expected: TrafficIncidentDetails];

export const apiAndParsedResponses: TestCase[] = [
    ['empty incidents list', { incidents: [] }, { type: 'FeatureCollection', features: [] }],
    [
        'single Point incident — accident, major delay',
        {
            incidents: [
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [4.9041, 52.3676] },
                    properties: {
                        id: 'inc-001',
                        iconCategory: 1, // accident
                        magnitudeOfDelay: 3, // major
                        events: [{ description: 'Multi-vehicle accident', code: 1001, iconCategory: 1 }],
                        startTime: '2024-01-15T08:30:00Z',
                        endTime: '2024-01-15T10:00:00Z',
                        from: 'Ring Road West',
                        to: 'Airport Exit',
                        length: 1200,
                        delay: 900,
                        roadNumbers: ['A10'],
                        timeValidity: 'present',
                        probabilityOfOccurrence: 'certain',
                        numberOfReports: 12,
                        lastReportTime: '2024-01-15T09:15:00Z',
                    },
                },
            ],
        },
        {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [4.9041, 52.3676] },
                    properties: {
                        id: 'inc-001',
                        category: 'accident',
                        magnitudeOfDelay: 'major',
                        events: [{ description: 'Multi-vehicle accident', code: 1001, category: 'accident' }],
                        startTime: new Date('2024-01-15T08:30:00Z'),
                        endTime: new Date('2024-01-15T10:00:00Z'),
                        from: 'Ring Road West',
                        to: 'Airport Exit',
                        lengthInMeters: 1200,
                        delayInSeconds: 900,
                        roadNumbers: ['A10'],
                        timeValidity: 'present',
                        probabilityOfOccurrence: 'certain',
                        numberOfReports: 12,
                        lastReportTime: new Date('2024-01-15T09:15:00Z'),
                    },
                },
            ],
        },
    ],
    [
        'LineString incident — roadworks, minor delay, with TMC',
        {
            incidents: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [4.9, 52.36],
                            [4.91, 52.37],
                            [4.92, 52.38],
                        ],
                    },
                    properties: {
                        id: 'inc-002',
                        iconCategory: 9, // roadworks
                        magnitudeOfDelay: 1, // minor
                        events: [
                            { description: 'Road surface works', code: 2001, iconCategory: 9 },
                            { description: 'Lane narrowing', code: 2002, iconCategory: 9 },
                        ],
                        from: 'Junction 4',
                        to: 'Junction 6',
                        length: 3500,
                        delay: 120,
                        roadNumbers: ['A2', 'E35'],
                        timeValidity: 'future',
                        probabilityOfOccurrence: 'probable',
                        tmc: {
                            countryCode: 'NL',
                            tableNumber: '1',
                            tableVersion: '2',
                            direction: 'positive',
                            points: [{ location: 1234, offset: 5 }, { location: 1235 }],
                        },
                    },
                },
            ],
        },
        {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [4.9, 52.36],
                            [4.91, 52.37],
                            [4.92, 52.38],
                        ],
                    },
                    properties: {
                        id: 'inc-002',
                        category: 'roadworks',
                        magnitudeOfDelay: 'minor',
                        events: [
                            { description: 'Road surface works', code: 2001, category: 'roadworks' },
                            { description: 'Lane narrowing', code: 2002, category: 'roadworks' },
                        ],
                        from: 'Junction 4',
                        to: 'Junction 6',
                        lengthInMeters: 3500,
                        delayInSeconds: 120,
                        roadNumbers: ['A2', 'E35'],
                        timeValidity: 'future',
                        probabilityOfOccurrence: 'probable',
                        tmc: {
                            countryCode: 'NL',
                            tableNumber: '1',
                            tableVersion: '2',
                            direction: 'positive',
                            points: [{ location: 1234, offset: 5 }, { location: 1235 }],
                        },
                    },
                },
            ],
        },
    ],
    [
        'incident with unknown iconCategory maps to other',
        {
            incidents: [
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [4.9, 52.3] },
                    properties: {
                        id: 'inc-003',
                        iconCategory: 99, // unknown code
                        magnitudeOfDelay: 0, // unknown
                        events: [],
                        timeValidity: 'present',
                    },
                },
            ],
        },
        {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [4.9, 52.3] },
                    properties: {
                        id: 'inc-003',
                        category: 'other',
                        magnitudeOfDelay: 'unknown',
                        events: [],
                        timeValidity: 'present',
                    },
                },
            ],
        },
    ],
    [
        'road-closed incident — iconCategory 8, indefinite delay',
        {
            incidents: [
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [13.405, 52.52] },
                    properties: {
                        id: 'inc-004',
                        iconCategory: 8, // road-closed
                        magnitudeOfDelay: 4, // indefinite
                        events: [{ description: 'Road closed', code: 3001, iconCategory: 8 }],
                        timeValidity: 'present',
                        probabilityOfOccurrence: 'certain',
                    },
                },
            ],
        },
        {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [13.405, 52.52] },
                    properties: {
                        id: 'inc-004',
                        category: 'road-closed',
                        magnitudeOfDelay: 'indefinite',
                        events: [{ description: 'Road closed', code: 3001, category: 'road-closed' }],
                        timeValidity: 'present',
                        probabilityOfOccurrence: 'certain',
                    },
                },
            ],
        },
    ],
    [
        'null entries in incidents array are filtered out',
        {
            incidents: [null, null],
        },
        {
            type: 'FeatureCollection',
            features: [],
        },
    ],
];
