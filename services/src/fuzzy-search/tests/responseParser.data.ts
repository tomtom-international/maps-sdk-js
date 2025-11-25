import type { FuzzySearchResponse, FuzzySearchResponseAPI } from '../types';

export const apiAndParsedResponses: Array<[string, FuzzySearchResponseAPI, FuzzySearchResponse]> = [
    [
        'Fuzzy search with required parameters',
        {
            summary: {
                query: 'hotel',
                queryType: 'NON_NEAR',
                queryTime: 206,
                numResults: 2,
                offset: 0,
                totalResults: 1528897,
                fuzzyLevel: 1,
                geoBias: {
                    lat: 37.337,
                    lon: -121.89,
                },
                queryIntent: [],
            },
            results: [
                {
                    type: 'POI',
                    id: '840069015734006',
                    score: 2.5745258331,
                    dist: 78.08678234100528,
                    info: 'search:ta:840069015734006-US',
                    poi: {
                        name: 'The James Apartments',
                        phone: '+1 408-975-6273',
                        categorySet: [
                            {
                                id: 7314003,
                            },
                        ],
                        url: 'https://www.livethejamesapartments.com',
                        categories: ['hotel', 'hotel/motel'],
                        classifications: [
                            {
                                code: 'HOTEL_MOTEL',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'hotel',
                                    },
                                    {
                                        nameLocale: 'en-US',
                                        name: 'hotel/motel',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetNumber: '98',
                        streetName: 'North 1st Street',
                        municipalitySubdivision: 'Downtown San Jose',
                        municipality: 'San Jose',
                        countrySecondarySubdivision: 'Santa Clara',
                        countrySubdivision: 'CA',
                        countrySubdivisionName: 'California',
                        postalCode: '95113',
                        extendedPostalCode: '95113-1200',
                        countryCode: 'US',
                        country: 'United States',
                        countryCodeISO3: 'USA',
                        freeformAddress: '98 North 1st Street, San Jose, CA 95113',
                        localName: 'San Jose',
                    },
                    position: {
                        lat: 37.33728,
                        lon: -121.89081,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 37.33818,
                            lon: -121.89194,
                        },
                        btmRightPoint: {
                            lat: 37.33638,
                            lon: -121.88968,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 37.33705,
                                lon: -121.89123,
                            },
                        },
                    ],
                },
                {
                    type: 'POI',
                    id: '840069008281694',
                    score: 2.574524641,
                    dist: 100.86055390285325,
                    info: 'search:ta:840069008281694-US',
                    poi: {
                        name: 'Hyatt',
                        phone: '+1 408-288-2820',
                        brands: [
                            {
                                name: 'Hyatt',
                            },
                        ],
                        categorySet: [
                            {
                                id: 7314003,
                            },
                        ],
                        url: 'www.hyatt.com/',
                        categories: ['hotel', 'hotel/motel'],
                        classifications: [
                            {
                                code: 'HOTEL_MOTEL',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'hotel',
                                    },
                                    {
                                        nameLocale: 'en-US',
                                        name: 'hotel/motel',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetNumber: '40',
                        streetName: 'North 1st Street',
                        municipalitySubdivision: 'Downtown San Jose',
                        municipality: 'San Jose',
                        countrySecondarySubdivision: 'Santa Clara',
                        countrySubdivision: 'CA',
                        countrySubdivisionName: 'California',
                        postalCode: '95113',
                        extendedPostalCode: '95113-1202',
                        countryCode: 'US',
                        country: 'United States',
                        countryCodeISO3: 'USA',
                        freeformAddress: '40 North 1st Street, San Jose, CA 95113',
                        localName: 'San Jose',
                    },
                    position: {
                        lat: 37.33661,
                        lon: -121.89103,
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 37.33751,
                            lon: -121.89216,
                        },
                        btmRightPoint: {
                            lat: 37.33571,
                            lon: -121.8899,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 37.33666,
                                lon: -121.89094,
                            },
                        },
                    ],
                },
            ],
        },
        {
            type: 'FeatureCollection',
            properties: {
                fuzzyLevel: 1,
                geoBias: [-121.89, 37.337],
                numResults: 2,
                offset: 0,
                query: 'hotel',
                queryTime: 206,
                queryType: 'NON_NEAR',
                queryIntent: [],
                totalResults: 1528897,
            },
            bbox: [-121.89103, 37.33661, -121.89081, 37.33728],
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [-121.89081, 37.33728],
                    },
                    id: '840069015734006',
                    properties: {
                        type: 'POI',
                        score: 2.5745258331,
                        distance: 78.08678234100528,
                        info: 'search:ta:840069015734006-US',
                        poi: {
                            name: 'The James Apartments',
                            phone: '+1 408-975-6273',
                            categoryIds: [7314003],
                            url: 'https://www.livethejamesapartments.com',
                            categories: ['hotel', 'hotel/motel'],
                            brands: [],
                            classifications: [
                                {
                                    code: 'HOTEL_MOTEL',
                                    names: [
                                        {
                                            nameLocale: 'en-US',
                                            name: 'hotel',
                                        },
                                        {
                                            nameLocale: 'en-US',
                                            name: 'hotel/motel',
                                        },
                                    ],
                                },
                            ],
                        },
                        address: {
                            streetNumber: '98',
                            streetName: 'North 1st Street',
                            municipalitySubdivision: 'Downtown San Jose',
                            municipality: 'San Jose',
                            countrySecondarySubdivision: 'Santa Clara',
                            countrySubdivision: 'CA',
                            countrySubdivisionName: 'California',
                            postalCode: '95113',
                            extendedPostalCode: '95113-1200',
                            countryCode: 'US',
                            country: 'United States',
                            countryCodeISO3: 'USA',
                            freeformAddress: '98 North 1st Street, San Jose, CA 95113',
                            localName: 'San Jose',
                        },
                        entryPoints: [
                            {
                                type: 'main',
                                position: [-121.89123, 37.33705],
                            },
                        ],
                    },
                },
                {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [-121.89103, 37.33661],
                    },
                    id: '840069008281694',
                    properties: {
                        type: 'POI',
                        score: 2.574524641,
                        distance: 100.86055390285325,
                        info: 'search:ta:840069008281694-US',
                        poi: {
                            name: 'Hyatt',
                            phone: '+1 408-288-2820',
                            brands: ['Hyatt'],
                            categoryIds: [7314003],
                            url: 'www.hyatt.com/',
                            categories: ['hotel', 'hotel/motel'],
                            classifications: [
                                {
                                    code: 'HOTEL_MOTEL',
                                    names: [
                                        {
                                            nameLocale: 'en-US',
                                            name: 'hotel',
                                        },
                                        {
                                            nameLocale: 'en-US',
                                            name: 'hotel/motel',
                                        },
                                    ],
                                },
                            ],
                        },
                        address: {
                            streetNumber: '40',
                            streetName: 'North 1st Street',
                            municipalitySubdivision: 'Downtown San Jose',
                            municipality: 'San Jose',
                            countrySecondarySubdivision: 'Santa Clara',
                            countrySubdivision: 'CA',
                            countrySubdivisionName: 'California',
                            postalCode: '95113',
                            extendedPostalCode: '95113-1202',
                            countryCode: 'US',
                            country: 'United States',
                            countryCodeISO3: 'USA',
                            freeformAddress: '40 North 1st Street, San Jose, CA 95113',
                            localName: 'San Jose',
                        },
                        entryPoints: [
                            {
                                type: 'main',
                                position: [-121.89094, 37.33666],
                            },
                        ],
                    },
                },
            ],
        },
    ],
    [
        'Fuzzy search with query intent',
        {
            summary: {
                query: 'cafe near paris',
                queryType: 'NEARBY',
                queryTime: 233,
                numResults: 1,
                offset: 0,
                totalResults: 1816776,
                fuzzyLevel: 1,
                geoBias: {
                    lat: 52.3759,
                    lon: 4.8975,
                },
                queryIntent: [
                    {
                        details: {
                            lat: 48.85689,
                            lon: 2.35085,
                            query: 'cafe',
                            text: 'paris',
                        },
                        type: 'NEARBY',
                    },
                ],
            },
            results: [
                {
                    type: 'POI',
                    id: '250007000158665',
                    score: 2.5745277405,
                    dist: 430514.6483378931,
                    info: 'search:ta:250007000158665-FR',
                    poi: {
                        name: 'Le Penalty',
                        phone: '+33 4 95 31 03 47',
                        categorySet: [
                            {
                                id: 9376002,
                            },
                        ],
                        categories: ['café', 'café/pub'],
                        classifications: [
                            {
                                code: 'CAFE_PUB',
                                names: [
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café',
                                    },
                                    {
                                        nameLocale: 'en-US',
                                        name: 'café/pub',
                                    },
                                ],
                            },
                        ],
                    },
                    address: {
                        streetName: "Place de l'Hôtel de Ville",
                        municipalitySubdivision: '4ème Arrondissement',
                        municipality: 'Paris',
                        countrySecondarySubdivision: 'Paris',
                        countrySubdivision: 'Île-de-France',
                        postalCode: '75004',
                        countryCode: 'FR',
                        country: 'France',
                        countryCodeISO3: 'FRA',
                        freeformAddress: "Place de l'Hôtel de Ville, 75004 Paris",
                        localName: 'Paris',
                    },
                    position: {
                        lat: 48.85679,
                        lon: 2.35102,
                    },
                    boundingBox: {
                        topLeftPoint: {
                            lat: 48.85769,
                            lon: 2.34965,
                        },
                        btmRightPoint: {
                            lat: 48.85589,
                            lon: 2.35239,
                        },
                    },
                    viewport: {
                        topLeftPoint: {
                            lat: 48.85769,
                            lon: 2.34965,
                        },
                        btmRightPoint: {
                            lat: 48.85589,
                            lon: 2.35239,
                        },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: {
                                lat: 48.85682,
                                lon: 2.3511,
                            },
                        },
                    ],
                },
            ],
        },
        {
            type: 'FeatureCollection',
            properties: {
                fuzzyLevel: 1,
                numResults: 1,
                geoBias: [4.8975, 52.3759],
                offset: 0,
                query: 'cafe near paris',
                queryTime: 233,
                queryType: 'NEARBY',
                queryIntent: [
                    {
                        details: {
                            position: [2.35085, 48.85689],
                            query: 'cafe',
                            text: 'paris',
                        },
                        type: 'NEARBY',
                    },
                ],
                totalResults: 1816776,
            },
            bbox: [2.34965, 48.85589, 2.35239, 48.85769],
            features: [
                {
                    type: 'Feature',
                    bbox: [2.34965, 48.85589, 2.35239, 48.85769],
                    geometry: {
                        type: 'Point',
                        coordinates: [2.35102, 48.85679],
                    },
                    id: '250007000158665',
                    properties: {
                        type: 'POI',
                        score: 2.5745277405,
                        distance: 430514.6483378931,
                        info: 'search:ta:250007000158665-FR',
                        poi: {
                            name: 'Le Penalty',
                            phone: '+33 4 95 31 03 47',
                            categoryIds: [9376002],
                            categories: ['café', 'café/pub'],
                            classifications: [
                                {
                                    code: 'CAFE_PUB',
                                    names: [
                                        {
                                            nameLocale: 'en-US',
                                            name: 'café',
                                        },
                                        {
                                            nameLocale: 'en-US',
                                            name: 'café/pub',
                                        },
                                    ],
                                },
                            ],
                            brands: [],
                        },
                        address: {
                            streetName: "Place de l'Hôtel de Ville",
                            municipalitySubdivision: '4ème Arrondissement',
                            municipality: 'Paris',
                            countrySecondarySubdivision: 'Paris',
                            countrySubdivision: 'Île-de-France',
                            postalCode: '75004',
                            countryCode: 'FR',
                            country: 'France',
                            countryCodeISO3: 'FRA',
                            freeformAddress: "Place de l'Hôtel de Ville, 75004 Paris",
                            localName: 'Paris',
                        },
                        entryPoints: [
                            {
                                type: 'main',
                                position: [2.3511, 48.85682],
                            },
                        ],
                    },
                },
            ],
        },
    ],
    [
        'No Results',
        {
            summary: {
                query: 'ams',
                queryType: 'NON_NEAR',
                queryTime: 161,
                numResults: 0,
                offset: 0,
                totalResults: 0,
                fuzzyLevel: 2,
                queryIntent: [],
            },
            results: [],
        },
        {
            type: 'FeatureCollection',
            properties: {
                fuzzyLevel: 2,
                numResults: 0,
                offset: 0,
                query: 'ams',
                queryTime: 161,
                queryType: 'NON_NEAR',
                queryIntent: [],
                totalResults: 0,
            },
            features: [],
        },
    ],
];
