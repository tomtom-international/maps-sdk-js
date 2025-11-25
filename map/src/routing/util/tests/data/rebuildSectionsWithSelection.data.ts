import type { RouteSections } from '../../../types/routeSections';

type TestCase = [string, RouteSections, RouteSections];

export const rebuildSectionsWithSelectionData: TestCase[] = [
    [
        'Single section',
        {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [0, 0],
                            [0, 1],
                        ],
                    },
                    properties: {
                        id: 'section-0',
                        startPointIndex: 0,
                        endPointIndex: 2,
                        routeIndex: 0,
                        routeState: 'deselected',
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
                            [0, 0],
                            [0, 1],
                        ],
                    },
                    properties: {
                        id: 'section-0',
                        startPointIndex: 0,
                        endPointIndex: 2,
                        routeIndex: 0,
                        routeState: 'selected',
                    },
                },
            ],
        },
    ],
    [
        'A couple of sections belonging to different routes',
        {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [0, 0],
                            [0, 1],
                        ],
                    },
                    properties: {
                        id: 'section-0',
                        startPointIndex: 0,
                        endPointIndex: 2,
                        routeIndex: 0,
                        routeState: 'deselected',
                    },
                },
                {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [1, 0],
                            [1, 1],
                        ],
                    },
                    properties: {
                        id: 'section-0',
                        startPointIndex: 2,
                        endPointIndex: 4,
                        routeIndex: 1,
                        routeState: 'selected',
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
                            [0, 0],
                            [0, 1],
                        ],
                    },
                    properties: {
                        id: 'section-0',
                        startPointIndex: 0,
                        endPointIndex: 2,
                        routeIndex: 0,
                        routeState: 'selected',
                    },
                },
                {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [1, 0],
                            [1, 1],
                        ],
                    },
                    properties: {
                        id: 'section-0',
                        startPointIndex: 2,
                        endPointIndex: 4,
                        routeIndex: 1,
                        routeState: 'deselected',
                    },
                },
            ],
        },
    ],
];
