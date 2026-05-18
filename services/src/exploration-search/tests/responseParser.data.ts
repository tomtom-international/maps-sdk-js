import type { ExplorationSearchParams, ExplorationSearchResponse, ExplorationSearchResponseAPI } from '../types';

export const apiAndParsedResponses: Array<
    [string, ExplorationSearchResponseAPI, ExplorationSearchParams, ExplorationSearchResponse]
> = [
    [
        'POI hit with area metadata, classifications, brands and timeZone',
        {
            total: 2114,
            hits: [
                {
                    id: 'ctdAgLNScK-poi-001',
                    score: 12.34,
                    type: 'POI',
                    dataSource: 'ev',
                    country_code: 'NL',
                    position: [4.731, 52.6376],
                    address: {
                        streetName: 'Frans Halsstraat',
                        streetNumber: '1',
                        municipality: 'Alkmaar',
                        countrySubdivision: 'North Holland',
                        countryCode: 'NL',
                        country: 'Netherlands',
                        postalCode: '1816 CM',
                        freeformAddress: '1 Frans Halsstraat, Alkmaar, North Holland, 1816 CM',
                    },
                    poi: {
                        name: 'ubitricity',
                        phone: '+49 800 3004500',
                        url: 'https://example.com',
                        brands: [{ id: 'UB6LMZN4', name: 'ubitricity' }],
                        categorySet: ['7309'],
                        classifications: [{ code: '7309', name: 'electric vehicle station' }],
                        preferredCategoryId: '7309',
                        openingHours: {
                            is24h: true,
                            intervals: [{ days: [1, 2, 3, 4, 5, 6, 7], open: '00:00', close: '24:00' }],
                        },
                        accessType: 'Public',
                        timeZone: { ianaId: 'Europe/Amsterdam' },
                    },
                    area_id: '20567430',
                    area_country: 'NL',
                    area_tags: ['walkable', 'transit_connected'],
                },
            ],
        },
        { query: 'ubitricity', boundingBox: [4.7, 52.6, 4.8, 52.7] },
        {
            type: 'FeatureCollection',
            properties: {
                query: 'ubitricity',
                queryType: 'NON_NEAR',
                queryTime: 0,
                numResults: 1,
                offset: 0,
                totalResults: 2114,
                fuzzyLevel: 0,
            },
            features: [
                {
                    type: 'Feature',
                    id: 'ctdAgLNScK-poi-001',
                    geometry: { type: 'Point', coordinates: [4.731, 52.6376] },
                    properties: {
                        type: 'POI',
                        score: 12.34,
                        address: {
                            streetName: 'Frans Halsstraat',
                            streetNumber: '1',
                            municipality: 'Alkmaar',
                            countrySubdivision: 'North Holland',
                            countryCode: 'NL',
                            country: 'Netherlands',
                            postalCode: '1816 CM',
                            freeformAddress: '1 Frans Halsstraat, Alkmaar, North Holland, 1816 CM',
                        },
                        poi: {
                            name: 'ubitricity',
                            phone: '+49 800 3004500',
                            url: 'https://example.com',
                            brands: ['ubitricity'],
                            categories: ['ELECTRIC_VEHICLE_STATION'],
                            localizedCategories: ['electric vehicle station'],
                            timeZone: { ianaId: 'Europe/Amsterdam' },
                        },
                        areaId: '20567430',
                        areaCountry: 'NL',
                        areaTags: ['walkable', 'transit_connected'],
                    },
                },
            ],
        },
    ],
    [
        'PointAddress hit — no poi block, no area metadata outside DE/NL/FR',
        {
            total: 1,
            hits: [
                {
                    id: 'addr-001',
                    type: 'PointAddress',
                    country_code: 'ES',
                    position: [-3.7038, 40.4168],
                    address: {
                        streetNumber: '12',
                        streetName: 'Calle Mayor',
                        municipality: 'Madrid',
                        countryCode: 'ES',
                        freeformAddress: '12 Calle Mayor, Madrid',
                        entryPoint: '0;40.4168;-3.7038;MAIN;;geocoding,routing;true',
                    },
                },
            ],
        },
        { boundingBox: [-3.8, 40.3, -3.6, 40.5] },
        {
            type: 'FeatureCollection',
            properties: {
                query: '',
                queryType: 'NON_NEAR',
                queryTime: 0,
                numResults: 1,
                offset: 0,
                totalResults: 1,
                fuzzyLevel: 0,
            },
            features: [
                {
                    type: 'Feature',
                    id: 'addr-001',
                    geometry: { type: 'Point', coordinates: [-3.7038, 40.4168] },
                    properties: {
                        type: 'Point Address',
                        address: {
                            streetNumber: '12',
                            streetName: 'Calle Mayor',
                            municipality: 'Madrid',
                            countryCode: 'ES',
                            freeformAddress: '12 Calle Mayor, Madrid',
                            entryPoint: '0;40.4168;-3.7038;MAIN;;geocoding,routing;true',
                        },
                    },
                },
            ],
        },
    ],
    [
        'Street hit — viewport envelope is converted to a bbox on the feature',
        {
            total: 1,
            hits: [
                {
                    id: 'street-001',
                    type: 'Street',
                    country_code: 'DE',
                    position: [6.175454, 50.993546],
                    address: {
                        municipality: 'Aachen',
                        countryCode: 'DE',
                        freeformAddress: 'Aachen',
                    },
                    viewport: {
                        type: 'envelope',
                        coordinates: [
                            [6.175264, 50.993678],
                            [6.175644, 50.993414],
                        ],
                    },
                    area_id: '50000001',
                    area_country: 'DE',
                    area_tags: ['mid_town', 'transit_connected'],
                },
            ],
        },
        { boundingBox: [6, 50, 7, 51] },
        {
            type: 'FeatureCollection',
            // With a single feature carrying a bbox, the FeatureCollection bbox derives from it.
            bbox: [6.175264, 50.993678, 6.175644, 50.993414],
            properties: {
                query: '',
                queryType: 'NON_NEAR',
                queryTime: 0,
                numResults: 1,
                offset: 0,
                totalResults: 1,
                fuzzyLevel: 0,
            },
            features: [
                {
                    type: 'Feature',
                    id: 'street-001',
                    geometry: { type: 'Point', coordinates: [6.175454, 50.993546] },
                    bbox: [6.175264, 50.993678, 6.175644, 50.993414],
                    properties: {
                        type: 'Street',
                        address: {
                            municipality: 'Aachen',
                            countryCode: 'DE',
                            freeformAddress: 'Aachen',
                        },
                        areaId: '50000001',
                        areaCountry: 'DE',
                        areaTags: ['mid_town', 'transit_connected'],
                    },
                },
            ],
        },
    ],
    [
        'near + distance_m surfaces queryType=NEARBY and per-feature distance',
        {
            total: 2,
            hits: [
                {
                    id: 'near-001',
                    type: 'POI',
                    distance_m: 78.2,
                    country_code: 'NL',
                    position: [4.9, 52.38],
                    address: {
                        municipality: 'Amsterdam',
                        countryCode: 'NL',
                        freeformAddress: 'Amsterdam',
                    },
                    poi: {
                        name: 'Bakery',
                        categorySet: ['7315'],
                        classifications: [{ code: '7315', name: 'restaurant' }],
                    },
                },
                {
                    id: 'near-002',
                    type: 'POI',
                    distance_m: 200,
                    country_code: 'NL',
                    position: [4.91, 52.39],
                    address: {
                        municipality: 'Amsterdam',
                        countryCode: 'NL',
                        freeformAddress: 'Amsterdam',
                    },
                    poi: {
                        name: 'Cafe',
                        categorySet: ['7315'],
                        classifications: [{ code: '7315', name: 'restaurant' }],
                    },
                },
            ],
        },
        { position: [4.9003, 52.3791], radiusMeters: 1000 },
        {
            type: 'FeatureCollection',
            properties: {
                query: '',
                queryType: 'NEARBY',
                queryTime: 0,
                numResults: 2,
                offset: 0,
                totalResults: 2,
                fuzzyLevel: 0,
                geoBias: [4.9003, 52.3791],
            },
            bbox: [4.9, 52.38, 4.91, 52.39],
            features: [
                {
                    type: 'Feature',
                    id: 'near-001',
                    geometry: { type: 'Point', coordinates: [4.9, 52.38] },
                    properties: {
                        type: 'POI',
                        distance: 78.2,
                        address: {
                            municipality: 'Amsterdam',
                            countryCode: 'NL',
                            freeformAddress: 'Amsterdam',
                        },
                        poi: {
                            name: 'Bakery',
                            categories: ['RESTAURANT'],
                            localizedCategories: ['restaurant'],
                        },
                    },
                },
                {
                    type: 'Feature',
                    id: 'near-002',
                    geometry: { type: 'Point', coordinates: [4.91, 52.39] },
                    properties: {
                        type: 'POI',
                        distance: 200,
                        address: {
                            municipality: 'Amsterdam',
                            countryCode: 'NL',
                            freeformAddress: 'Amsterdam',
                        },
                        poi: {
                            name: 'Cafe',
                            categories: ['RESTAURANT'],
                            localizedCategories: ['restaurant'],
                        },
                    },
                },
            ],
        },
    ],
    [
        'preferredCategoryId is merged with categorySet, leaf-first ordering',
        {
            total: 1,
            hits: [
                {
                    id: 'cat-001',
                    type: 'POI',
                    country_code: 'NL',
                    position: [4.9, 52.38],
                    address: {
                        municipality: 'Amsterdam',
                        countryCode: 'NL',
                        freeformAddress: 'Amsterdam',
                    },
                    poi: {
                        name: 'Trattoria',
                        // 7315 = restaurant (parent), 7315025 = ITALIAN_RESTAURANT (leaf)
                        categorySet: ['7315'],
                        preferredCategoryId: '7315025',
                        classifications: [
                            { code: '7315025', name: 'italian restaurant' },
                            { code: '7315', name: 'restaurant' },
                        ],
                    },
                },
            ],
        },
        { query: 'trattoria', boundingBox: [4.8, 52.3, 5, 52.4] },
        {
            type: 'FeatureCollection',
            properties: {
                query: 'trattoria',
                queryType: 'NON_NEAR',
                queryTime: 0,
                numResults: 1,
                offset: 0,
                totalResults: 1,
                fuzzyLevel: 0,
            },
            features: [
                {
                    type: 'Feature',
                    id: 'cat-001',
                    geometry: { type: 'Point', coordinates: [4.9, 52.38] },
                    properties: {
                        type: 'POI',
                        address: {
                            municipality: 'Amsterdam',
                            countryCode: 'NL',
                            freeformAddress: 'Amsterdam',
                        },
                        poi: {
                            name: 'Trattoria',
                            // Leaf-first ordering: ITALIAN_RESTAURANT (larger numeric id) before RESTAURANT.
                            categories: ['ITALIAN_RESTAURANT', 'RESTAURANT'],
                            localizedCategories: ['italian restaurant', 'restaurant'],
                        },
                    },
                },
            ],
        },
    ],
    [
        'empty hits yields an empty FeatureCollection and respects pagination offset',
        {
            total: 0,
            hits: [],
        },
        { query: 'noresults', boundingBox: [0, 0, 1, 1], offset: 40, limit: 10 },
        {
            type: 'FeatureCollection',
            properties: {
                query: 'noresults',
                queryType: 'NON_NEAR',
                queryTime: 0,
                numResults: 0,
                offset: 40,
                totalResults: 0,
                fuzzyLevel: 0,
            },
            features: [],
        },
    ],
];
