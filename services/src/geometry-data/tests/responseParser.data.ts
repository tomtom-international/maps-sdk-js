import type { PolygonFeatures } from '@tomtom-org/maps-sdk/core';
import type { GeoJsonObject, Position } from 'geojson';
import type { GeometryDataResponseAPI } from '../types/apiTypes';

const data: [string, GeometryDataResponseAPI, PolygonFeatures][] = [
    [
        'Single Polygon',
        {
            additionalData: [
                {
                    providerID: '00004e4c-3100-3c00-0000-000059685013',
                    geometryData: {
                        type: 'FeatureCollection',
                        features: [
                            {
                                type: 'Feature',
                                properties: {},
                                geometry: {
                                    type: 'Polygon',
                                    coordinates: [
                                        [
                                            [4.721834, 52.3261134],
                                            [4.7219238, 52.3260697],
                                            [4.7341218, 52.2980503],
                                            [4.7408094, 52.2988134],
                                            [4.7420741, 52.3001949],
                                            [4.7422579, 52.3001254],
                                            [4.7424197, 52.3000643],
                                            [4.7425288, 52.3000228],
                                            [4.7436488, 52.2995789],
                                            [4.721834, 52.3261134],
                                        ],
                                    ],
                                },
                                id: '00004e4c-3100-3c00-0000-000059685013',
                            },
                        ],
                    } as GeoJsonObject,
                },
            ],
        },
        {
            type: 'FeatureCollection',
            bbox: [4.721834, 52.2980503, 4.7436488, 52.3261134],
            features: [
                {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [4.721834, 52.3261134],
                                [4.7219238, 52.3260697],
                                [4.7341218, 52.2980503],
                                [4.7408094, 52.2988134],
                                [4.7420741, 52.3001949],
                                [4.7422579, 52.3001254],
                                [4.7424197, 52.3000643],
                                [4.7425288, 52.3000228],
                                [4.7436488, 52.2995789],
                                [4.721834, 52.3261134],
                            ],
                        ],
                    },
                    id: '00004e4c-3100-3c00-0000-000059685013',
                    bbox: [4.721834, 52.2980503, 4.7436488, 52.3261134],
                },
            ],
        },
    ],
    [
        'Multiple MultiPolygons',
        {
            additionalData: [
                {
                    providerID: 'PROVIDER_0',
                    geometryData: {
                        type: 'FeatureCollection',
                        features: [
                            {
                                type: 'Feature',
                                properties: {},
                                geometry: {
                                    type: 'MultiPolygon',
                                    coordinates: [
                                        [
                                            [
                                                [-10, -20],
                                                [-5, -10],
                                                [-8, -9],
                                                [-10, -20],
                                            ],
                                        ],
                                        [
                                            [10, 20],
                                            [5, 10],
                                            [8, 9],
                                            [10, 20],
                                        ],
                                    ],
                                },
                                id: 'PROVIDER_0',
                            },
                        ],
                    } as GeoJsonObject,
                },
                {
                    providerID: 'PROVIDER_1',
                    geometryData: {
                        type: 'FeatureCollection',
                        features: [
                            {
                                type: 'Feature',
                                properties: {},
                                geometry: {
                                    type: 'MultiPolygon',
                                    coordinates: [
                                        [
                                            [
                                                [-15, -25],
                                                [-5, -15],
                                                [-8, -9],
                                                [-15, -25],
                                            ],
                                        ],
                                        [
                                            [10, 20],
                                            [5, 10],
                                            [8, 9],
                                            [40, 80],
                                        ],
                                    ],
                                },
                                id: 'PROVIDER_1',
                            },
                        ],
                    } as GeoJsonObject,
                },
            ],
        },
        {
            type: 'FeatureCollection',
            bbox: [-15, -25, -5, -9],
            features: [
                {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'MultiPolygon',
                        coordinates: [
                            [
                                [
                                    [-10, -20],
                                    [-5, -10],
                                    [-8, -9],
                                    [-10, -20],
                                ],
                            ],
                            [
                                [10, 20],
                                [5, 10],
                                [8, 9],
                                [10, 20],
                            ],
                        ] as Position[][][],
                    },
                    id: 'PROVIDER_0',
                    bbox: [-10, -20, -5, -9],
                },
                {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'MultiPolygon',
                        coordinates: [
                            [
                                [
                                    [-15, -25],
                                    [-5, -15],
                                    [-8, -9],
                                    [-15, -25],
                                ],
                            ],
                            [
                                [10, 20],
                                [5, 10],
                                [8, 9],
                                [40, 80],
                            ],
                        ] as Position[][][],
                    },
                    id: 'PROVIDER_1',
                    bbox: [-15, -25, -5, -9],
                },
            ],
        },
    ],
];

export default data;
