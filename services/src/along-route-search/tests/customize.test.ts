import { describe, expect, test } from 'vitest';
import { customizeService } from '../../../index';

describe('Along Route Search customize obj', () => {
    test('buildAlongRouteSearchRequest via customizeService with LineString route', () => {
        expect(
            JSON.parse(
                JSON.stringify(
                    customizeService.alongRouteSearch.buildAlongRouteSearchRequest({
                        apiKey: 'API_KEY',
                        apiVersion: 1,
                        commonBaseURL: 'https://api.tomtom.com',
                        route: {
                            type: 'LineString',
                            coordinates: [
                                [4.9, 52.37],
                                [2.35, 48.85],
                            ],
                        },
                        maxDetourTimeSeconds: 300,
                        query: 'coffee',
                    }),
                ),
            ),
        ).toStrictEqual(
            JSON.parse(
                JSON.stringify({
                    url: 'https://api.tomtom.com/maps/orbis/places/searchAlongRoute/coffee.json?apiVersion=1&key=API_KEY&maxDetourTime=300&spreadingMode=plan',
                    data: {
                        route: {
                            points: [
                                { lat: 52.37, lon: 4.9 },
                                { lat: 48.85, lon: 2.35 },
                            ],
                        },
                    },
                }),
            ),
        );
    });

    test('buildAlongRouteSearchRequest via customizeService with Position[] route', () => {
        const result = JSON.parse(
            JSON.stringify(
                customizeService.alongRouteSearch.buildAlongRouteSearchRequest({
                    apiKey: 'API_KEY',
                    commonBaseURL: 'https://api.tomtom.com',
                    route: [
                        [4.9, 52.37],
                        [2.35, 48.85],
                    ],
                    maxDetourTimeSeconds: 300,
                }),
            ),
        );
        expect(result.data.route.points).toEqual([
            { lat: 52.37, lon: 4.9 },
            { lat: 48.85, lon: 2.35 },
        ]);
    });

    test('buildAlongRouteSearchRequest via customizeService with Route Feature input', () => {
        const result = JSON.parse(
            JSON.stringify(
                customizeService.alongRouteSearch.buildAlongRouteSearchRequest({
                    apiKey: 'API_KEY',
                    commonBaseURL: 'https://api.tomtom.com',
                    route: {
                        type: 'Feature',
                        id: 'route-0',
                        bbox: [2.35, 48.85, 4.9, 52.37],
                        geometry: {
                            type: 'LineString',
                            coordinates: [
                                [4.9, 52.37],
                                [2.35, 48.85],
                            ],
                        },
                        properties: {} as never,
                    },
                    maxDetourTimeSeconds: 300,
                }),
            ),
        );
        expect(result.data.route.points).toEqual([
            { lat: 52.37, lon: 4.9 },
            { lat: 48.85, lon: 2.35 },
        ]);
    });
});
