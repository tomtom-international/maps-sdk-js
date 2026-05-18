import type { ExplorationSearchParams, ExplorationSearchRequestAPI } from '../types';

const TEST_BASE_URL = 'https://exploration.example.com';
const EXPECTED_URL = new URL('/places', TEST_BASE_URL);

const requestBuilderData: [string, ExplorationSearchParams, ExplorationSearchRequestAPI][] = [
    [
        'minimal request — query + a single bounding box',
        {
            customServiceBaseURL: TEST_BASE_URL,
            query: 'restaurant',
            boundingBox: [4.85, 52.35, 4.95, 52.4],
        },
        {
            url: EXPECTED_URL,
            data: {
                q: 'restaurant',
                bboxes: [[4.85, 52.35, 4.95, 52.4]],
            },
        },
    ],
    [
        'near + radiusMeters maps to near.coordinates + near.radius_km',
        {
            customServiceBaseURL: TEST_BASE_URL,
            position: [4.9003, 52.3791],
            radiusMeters: 5000,
            poiCategories: ['RESTAURANT'],
            limit: 10,
        },
        {
            url: EXPECTED_URL,
            data: {
                near: { coordinates: [4.9003, 52.3791], radius_km: 5 },
                categories: ['7315'],
                size: 10,
            },
        },
    ],
    [
        'near without radiusMeters falls back to the 2km default',
        {
            customServiceBaseURL: TEST_BASE_URL,
            position: [4.9003, 52.3791],
        },
        {
            url: EXPECTED_URL,
            data: {
                near: { coordinates: [4.9003, 52.3791], radius_km: 2 },
            },
        },
    ],
    [
        'all filters combined — every supported param maps onto its API counterpart',
        {
            customServiceBaseURL: TEST_BASE_URL,
            query: 'charging',
            countries: ['NL'],
            poiBrands: ['Vattenfall'],
            poiCategories: ['ELECTRIC_VEHICLE_STATION'],
            municipalities: ['Amsterdam', 'Rotterdam'],
            placeTypes: ['POI', 'PointAddress'],
            areaId: '20567430',
            areaTags: ['walkable', 'transit_connected'],
            position: [4.9, 52.37],
            radiusMeters: 2500,
            boundingBox: [4.85, 52.35, 4.95, 52.4],
            boundingBoxes: [[4.45, 51.9, 4.55, 51.95]],
            geometries: [
                {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [4.878, 52.364],
                            [4.922, 52.364],
                            [4.922, 52.394],
                            [4.878, 52.394],
                            [4.878, 52.364],
                        ],
                    ],
                },
            ],
            offset: 20,
            limit: 50,
        },
        {
            url: EXPECTED_URL,
            data: {
                q: 'charging',
                country: 'NL',
                municipalities: ['Amsterdam', 'Rotterdam'],
                brand: 'Vattenfall',
                categories: ['7309'],
                types: ['POI', 'PointAddress'],
                area_id: '20567430',
                area_tags: ['walkable', 'transit_connected'],
                near: { coordinates: [4.9, 52.37], radius_km: 2.5 },
                bboxes: [
                    [4.85, 52.35, 4.95, 52.4],
                    [4.45, 51.9, 4.55, 51.95],
                ],
                geometries: [
                    {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [4.878, 52.364],
                                [4.922, 52.364],
                                [4.922, 52.394],
                                [4.878, 52.394],
                                [4.878, 52.364],
                            ],
                        ],
                    },
                ],
                from: 20,
                size: 50,
            },
        },
    ],
    [
        'FeatureCollection geometry is flattened to its features',
        {
            customServiceBaseURL: TEST_BASE_URL,
            municipalities: ['Amsterdam'],
            geometries: [
                {
                    type: 'FeatureCollection',
                    features: [
                        {
                            type: 'Feature',
                            properties: {},
                            bbox: [4, 52, 4.1, 52.1],
                            geometry: {
                                type: 'Polygon',
                                coordinates: [
                                    [
                                        [4, 52],
                                        [4.1, 52],
                                        [4.1, 52.1],
                                        [4, 52.1],
                                        [4, 52],
                                    ],
                                ],
                            },
                        },
                        {
                            type: 'Feature',
                            properties: {},
                            bbox: [5, 52, 5.1, 52.1],
                            geometry: {
                                type: 'MultiPolygon',
                                coordinates: [
                                    [
                                        [
                                            [5, 52],
                                            [5.1, 52],
                                            [5.1, 52.1],
                                            [5, 52.1],
                                            [5, 52],
                                        ],
                                    ],
                                ],
                            },
                        },
                    ],
                },
            ],
        },
        {
            url: EXPECTED_URL,
            data: {
                municipalities: ['Amsterdam'],
                geometries: [
                    {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [4, 52],
                                [4.1, 52],
                                [4.1, 52.1],
                                [4, 52.1],
                                [4, 52],
                            ],
                        ],
                    },
                    {
                        type: 'MultiPolygon',
                        coordinates: [
                            [
                                [
                                    [5, 52],
                                    [5.1, 52],
                                    [5.1, 52.1],
                                    [5, 52.1],
                                    [5, 52],
                                ],
                            ],
                        ],
                    },
                ],
            },
        },
    ],
    [
        'Polygon rings get duplicate consecutive points removed and are auto-closed',
        {
            customServiceBaseURL: TEST_BASE_URL,
            municipalities: ['Amsterdam'],
            geometries: [
                {
                    type: 'Polygon',
                    coordinates: [
                        // Unclosed ring with a consecutive duplicate that OpenSearch would reject.
                        [
                            [4, 52],
                            [4, 52],
                            [4.1, 52],
                            [4.1, 52.1],
                            [4, 52.1],
                        ],
                    ],
                },
            ],
        },
        {
            url: EXPECTED_URL,
            data: {
                municipalities: ['Amsterdam'],
                geometries: [
                    {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [4, 52],
                                [4.1, 52],
                                [4.1, 52.1],
                                [4, 52.1],
                                [4, 52],
                            ],
                        ],
                    },
                ],
            },
        },
    ],
    [
        'areaId alone — terms-only "what else is in this municipality" lookup',
        {
            customServiceBaseURL: TEST_BASE_URL,
            areaId: '20567430',
            limit: 50,
        },
        {
            url: EXPECTED_URL,
            data: {
                area_id: '20567430',
                size: 50,
            },
        },
    ],
];

export default requestBuilderData;
