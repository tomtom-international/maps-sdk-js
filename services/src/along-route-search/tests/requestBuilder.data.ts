import type { PostObject } from '../../shared';
import type { AlongRouteSearchParams, AlongRouteSearchPayloadAPI } from '../types';

const requestBuilderData: [string, AlongRouteSearchParams, PostObject<AlongRouteSearchPayloadAPI>][] = [
    [
        'Along route search with required parameters (LineString route)',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 1,
            commonBaseURL: 'https://api.tomtom.com',
            route: {
                type: 'LineString',
                coordinates: [
                    [4.9, 52.37],
                    [4.5, 51.5],
                    [2.35, 48.85],
                ],
            },
            maxDetourTimeSeconds: 300,
        },
        {
            url: new URL(
                'https://api.tomtom.com/maps/orbis/places/searchAlongRoute/.json?apiVersion=1&key=GLOBAL_API_KEY&maxDetourTime=300&spreadingMode=plan',
            ),
            data: {
                route: {
                    points: [
                        { lat: 52.37, lon: 4.9 },
                        { lat: 51.5, lon: 4.5 },
                        { lat: 48.85, lon: 2.35 },
                    ],
                },
            },
        },
    ],
    [
        'Along route search with all optional parameters',
        {
            apiKey: 'GLOBAL_API_KEY_2',
            apiVersion: 2,
            commonBaseURL: 'https://api-test.tomtom.com',
            route: {
                type: 'LineString',
                coordinates: [
                    [4.9, 52.37],
                    [3.7, 51.05],
                    [2.35, 48.85],
                ],
            },
            maxDetourTimeSeconds: 600,
            query: 'coffee',
            sortBy: 'detourOffset',
            limit: 20,
            language: 'en-GB',
        },
        {
            url: new URL(
                'https://api-test.tomtom.com/maps/orbis/places/searchAlongRoute/coffee.json?apiVersion=2&key=GLOBAL_API_KEY_2&language=en-GB&limit=20&maxDetourTime=600&sortBy=detourOffset&spreadingMode=plan',
            ),
            data: {
                route: {
                    points: [
                        { lat: 52.37, lon: 4.9 },
                        { lat: 51.05, lon: 3.7 },
                        { lat: 48.85, lon: 2.35 },
                    ],
                },
            },
        },
    ],
    [
        'Along route search with Route feature input',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 1,
            commonBaseURL: 'https://api.tomtom.com',
            route: {
                type: 'Feature',
                id: 'route-0',
                bbox: [2.35, 48.85, 4.9, 52.37],
                geometry: {
                    type: 'LineString',
                    coordinates: [
                        [4.9, 52.37],
                        [4.5, 51.5],
                        [2.35, 48.85],
                    ],
                },
                properties: {} as never,
            },
            maxDetourTimeSeconds: 300,
        },
        {
            url: new URL(
                'https://api.tomtom.com/maps/orbis/places/searchAlongRoute/.json?apiVersion=1&key=GLOBAL_API_KEY&maxDetourTime=300&spreadingMode=plan',
            ),
            data: {
                route: {
                    points: [
                        { lat: 52.37, lon: 4.9 },
                        { lat: 51.5, lon: 4.5 },
                        { lat: 48.85, lon: 2.35 },
                    ],
                },
            },
        },
    ],
    [
        'Along route search with Position[] route input',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 1,
            commonBaseURL: 'https://api.tomtom.com',
            route: [
                [4.9, 52.37],
                [4.5, 51.5],
                [2.35, 48.85],
            ],
            maxDetourTimeSeconds: 300,
        },
        {
            url: new URL(
                'https://api.tomtom.com/maps/orbis/places/searchAlongRoute/.json?apiVersion=1&key=GLOBAL_API_KEY&maxDetourTime=300&spreadingMode=plan',
            ),
            data: {
                route: {
                    points: [
                        { lat: 52.37, lon: 4.9 },
                        { lat: 51.5, lon: 4.5 },
                        { lat: 48.85, lon: 2.35 },
                    ],
                },
            },
        },
    ],
    [
        'Along route search with EV charging stations POI category',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 1,
            commonBaseURL: 'https://api.tomtom.com',
            route: {
                type: 'LineString',
                coordinates: [
                    [4.9, 52.37],
                    [2.35, 48.85],
                ],
            },
            maxDetourTimeSeconds: 600,
            poiCategories: ['ELECTRIC_VEHICLE_STATION'],
            sortBy: 'detourTime',
        },
        {
            url: new URL(
                'https://api.tomtom.com/maps/orbis/places/searchAlongRoute/.json?apiVersion=1&key=GLOBAL_API_KEY&categorySet=7309&maxDetourTime=600&sortBy=detourTime&spreadingMode=plan',
            ),
            data: {
                route: {
                    points: [
                        { lat: 52.37, lon: 4.9 },
                        { lat: 48.85, lon: 2.35 },
                    ],
                },
            },
        },
    ],
];

export default requestBuilderData;
