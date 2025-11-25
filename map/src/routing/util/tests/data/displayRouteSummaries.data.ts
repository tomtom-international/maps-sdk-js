import type { DisplayUnits, RouteSummary, Routes, TrafficSectionProps } from '@tomtom-org/maps-sdk/core';
import type { DisplayRouteProps, DisplayRouteSummaries } from '../../../types/displayRoutes';

type TestCase = [string, Routes<DisplayRouteProps>, DisplayUnits, DisplayRouteSummaries];

export const displayRouteSummariesData: TestCase[] = [
    [
        'No delays route',
        {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [0, 0],
                            [1, 1],
                            [2, 2],
                            [3, 3],
                        ],
                    },
                    properties: {
                        id: 'route-0',
                        index: 0,
                        routeState: 'selected',
                        summary: {
                            travelTimeInSeconds: 300,
                            lengthInMeters: 1000,
                        } as RouteSummary,
                        sections: { leg: [] },
                    },
                },
            ],
        },
        {},
        {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [2, 2],
                    },
                    properties: {
                        routeIndex: 0,
                        routeState: 'selected',
                        formattedDistance: '1 km',
                        formattedDuration: '5 min',
                    },
                },
            ],
        },
    ],
    [
        'Route with 1 delay',
        {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [0, 0],
                            [1, 1],
                            [2, 2],
                            [3, 3],
                            [4, 4],
                            [5, 5],
                        ],
                    },
                    properties: {
                        id: 'route-0',
                        index: 0,
                        routeState: 'selected',
                        summary: {
                            travelTimeInSeconds: 300,
                            lengthInMeters: 1000,
                            trafficDelayInSeconds: 600,
                        } as RouteSummary,
                        sections: {
                            leg: [],
                            traffic: [
                                {
                                    magnitudeOfDelay: 'moderate',
                                    delayInSeconds: 600,
                                },
                            ] as TrafficSectionProps[],
                        },
                    },
                },
            ],
        },
        { distance: { type: 'imperial_uk' } },
        {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [3, 3],
                    },
                    properties: {
                        routeIndex: 0,
                        routeState: 'selected',
                        formattedDistance: '½ mi',
                        formattedDuration: '5 min',
                        magnitudeOfDelay: 'moderate',
                        formattedTraffic: '10 min',
                    },
                },
            ],
        },
    ],
    [
        'Route with 2 delays',
        {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [0, 0],
                            [1, 1],
                            [2, 2],
                            [3, 3],
                        ],
                    },
                    properties: {
                        id: 'route-0',
                        index: 0,
                        routeState: 'selected',
                        summary: {
                            travelTimeInSeconds: 300,
                            lengthInMeters: 1000,
                            trafficDelayInSeconds: 600,
                        } as RouteSummary,
                        sections: {
                            leg: [],
                            traffic: [
                                {
                                    magnitudeOfDelay: 'minor',
                                    delayInSeconds: 200,
                                },
                                {
                                    magnitudeOfDelay: 'major',
                                    delayInSeconds: 400,
                                },
                            ] as TrafficSectionProps[],
                        },
                    },
                },
            ],
        },
        { distance: { type: 'imperial_us' }, time: { minutes: 'MINUTES' } },
        {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [2, 2],
                    },
                    properties: {
                        routeIndex: 0,
                        routeState: 'selected',
                        formattedDistance: '½ mi',
                        formattedDuration: '5 MINUTES',
                        magnitudeOfDelay: 'major',
                        formattedTraffic: '10 MINUTES',
                    },
                },
            ],
        },
    ],
    [
        '2 routes, one without delays, one with 2',
        {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [0, 0],
                            [1, 1],
                            [2, 2],
                            [3, 3],
                        ],
                    },
                    properties: {
                        id: 'route-0',
                        index: 0,
                        routeState: 'selected',
                        summary: {
                            travelTimeInSeconds: 400,
                            lengthInMeters: 2500,
                        } as RouteSummary,
                        sections: { leg: [] },
                    },
                },
                {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [0, 0],
                            [1, 1],
                            [2, 2],
                            [3, 3],
                        ],
                    },
                    properties: {
                        id: 'route-1',
                        index: 0,
                        routeState: 'selected',
                        summary: {
                            travelTimeInSeconds: 300,
                            lengthInMeters: 1000,
                            trafficDelayInSeconds: 800,
                        } as RouteSummary,
                        sections: {
                            leg: [],
                            traffic: [
                                {
                                    magnitudeOfDelay: 'minor',
                                    delayInSeconds: 500,
                                },
                                {
                                    magnitudeOfDelay: 'minor',
                                    delayInSeconds: 300,
                                },
                            ] as TrafficSectionProps[],
                        },
                    },
                },
            ],
        },
        {
            distance: { kilometers: 'kilometros' },
            time: { minutes: 'MIN', hours: 'IGNORED' },
        },
        {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [2, 2],
                    },
                    properties: {
                        routeIndex: 0,
                        routeState: 'selected',
                        formattedDistance: '2.5 kilometros',
                        formattedDuration: '7 MIN',
                    },
                },
                {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [2, 2],
                    },
                    properties: {
                        routeIndex: 0,
                        routeState: 'selected',
                        formattedDistance: '1 kilometros',
                        formattedDuration: '5 MIN',
                        magnitudeOfDelay: 'minor',
                        formattedTraffic: '13 MIN',
                    },
                },
            ],
        },
    ],
];
