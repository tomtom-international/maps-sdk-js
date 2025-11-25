import type { RouteSummary, Routes } from '@tomtom-org/maps-sdk/core';
import type { DisplayRouteProps } from '../../../types/displayRoutes';

export const dummyRoutesWithSectionsData: Routes<DisplayRouteProps> = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: [
                    [0, 0],
                    [0, 1],
                    [0, 2],
                    [0, 3],
                    [0, 4],
                    [0, 5],
                ],
            },
            properties: {
                id: 'route-0',
                index: 0,
                summary: {} as RouteSummary,
                routeState: 'selected',
                sections: {
                    leg: [],
                    ferry: [
                        {
                            id: '123',
                            startPointIndex: 1,
                            endPointIndex: 3,
                        },
                    ],
                    motorway: [
                        {
                            id: '123',
                            startPointIndex: 3,
                            endPointIndex: 5,
                        },
                    ],
                },
            },
        },
        {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: [
                    [1, 0],
                    [1, 1],
                    [1, 2],
                    [1, 3],
                    [1, 4],
                    [1, 5],
                ],
            },
            properties: {
                index: 1,
                id: 'route-1',
                summary: {} as RouteSummary,
                routeState: 'deselected',
                sections: {
                    leg: [],
                    ferry: [
                        {
                            id: '123',
                            startPointIndex: 2,
                            endPointIndex: 3,
                        },
                    ],
                    traffic: [
                        {
                            id: '123',
                            startPointIndex: 3,
                            endPointIndex: 5,
                            categories: ['rain'],
                            magnitudeOfDelay: 'moderate',
                            delayInSeconds: 350,
                            tec: {
                                causes: [
                                    {
                                        mainCauseCode: 19,
                                    },
                                ],
                            },
                        },
                    ],
                },
            },
        },
    ],
};
