import type { AlongRouteSearchParams } from '../types';

export const alongRouteSearchReqObject: AlongRouteSearchParams = {
    apiKey: 'APIKEY',
    commonBaseURL: 'https://api.tomtom.com',
    route: {
        type: 'LineString',
        coordinates: [
            [4.9, 52.37],
            [4.7, 52.2],
            [4.5, 51.9],
            [4.3, 51.6],
            [4.1, 51.3],
            [3.9, 51.0],
            [3.7, 50.7],
            [3.5, 50.4],
            [3.3, 50.1],
            [3.1, 49.8],
            [2.9, 49.5],
            [2.7, 49.2],
            [2.5, 48.9],
            [2.35, 48.85],
        ],
    },
    maxDetourTimeSeconds: 600,
    query: 'restaurant',
    sortBy: 'detourTime',
    limit: 50,
    language: 'en-US',
    poiCategories: ['RESTAURANT', 'FAST_FOOD', 'CAFE'],
};
