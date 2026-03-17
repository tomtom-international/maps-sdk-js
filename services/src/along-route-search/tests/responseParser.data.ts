import type { AlongRouteSearchResponse, AlongRouteSearchResponseAPI } from '../types';

export const apiAndParsedResponses: Array<[string, AlongRouteSearchResponseAPI, AlongRouteSearchResponse]> = [
    [
        'Along route search with EV charging station result',
        {
            summary: {
                query: 'electric vehicle station',
                queryType: 'NON_NEAR',
                queryTime: 56,
                numResults: 1,
                offset: 0,
                totalResults: 87,
                fuzzyLevel: 1,
            },
            results: [
                {
                    type: 'POI',
                    id: '528009007654321',
                    score: 5.123456789,
                    info: 'search:ev:528009007654321',
                    poi: {
                        name: 'TotalEnergies Charging Station',
                        categorySet: [{ id: 7309 }],
                        categories: ['electric vehicle station'],
                    },
                    address: {
                        streetName: 'Autoroute du Nord',
                        municipality: 'Valenciennes',
                        countrySubdivision: 'Hauts-de-France',
                        postalCode: '59300',
                        countryCode: 'FR',
                        country: 'France',
                        countryCodeISO3: 'FRA',
                        freeformAddress: 'Autoroute du Nord, 59300 Valenciennes',
                        localName: 'Valenciennes',
                    },
                    position: {
                        lat: 50.352,
                        lon: 3.523,
                    },
                    viewport: {
                        topLeftPoint: { lat: 50.353, lon: 3.522 },
                        btmRightPoint: { lat: 50.351, lon: 3.524 },
                    },
                    entryPoints: [
                        {
                            type: 'main',
                            position: { lat: 50.352, lon: 3.523 },
                        },
                    ],
                    chargingPark: {
                        connectors: [
                            {
                                id: 'connector-1',
                                connectorType: 'IEC62196Type2CableAttached',
                                ratedPowerKW: 22,
                                voltageV: 400,
                                currentA: 32,
                                currentType: 'AC3',
                            },
                        ],
                    },
                },
            ],
        },
        {
            type: 'FeatureCollection',
            properties: {
                query: 'electric vehicle station',
                queryType: 'NON_NEAR',
                queryTime: 56,
                numResults: 1,
                offset: 0,
                totalResults: 87,
                fuzzyLevel: 1,
            },
            features: [
                {
                    type: 'Feature',
                    id: '528009007654321',
                    geometry: {
                        type: 'Point',
                        coordinates: [3.523, 50.352],
                    },
                    properties: {
                        type: 'POI',
                        score: 5.123456789,
                        info: 'search:ev:528009007654321',
                        address: {
                            streetName: 'Autoroute du Nord',
                            municipality: 'Valenciennes',
                            countrySubdivision: 'Hauts-de-France',
                            postalCode: '59300',
                            countryCode: 'FR',
                            country: 'France',
                            countryCodeISO3: 'FRA',
                            freeformAddress: 'Autoroute du Nord, 59300 Valenciennes',
                            localName: 'Valenciennes',
                        },
                        chargingPark: {
                            connectors: [
                                {
                                    connector: {
                                        id: 'connector-1',
                                        type: 'IEC62196Type2CableAttached',
                                        ratedPowerKW: 22,
                                        voltageV: 400,
                                        currentA: 32,
                                        currentType: 'AC3',
                                        chargingSpeed: 'regular',
                                    },
                                    count: 1,
                                },
                            ],
                        },
                        entryPoints: [
                            {
                                type: 'main',
                                position: [3.523, 50.352],
                            },
                        ],
                        poi: {
                            name: 'TotalEnergies Charging Station',
                            localizedCategories: ['electric vehicle station'],
                            categories: ['ELECTRIC_VEHICLE_STATION'],
                        },
                    },
                },
            ],
        },
    ],
    [
        'Along route search with restaurant result',
        {
            summary: {
                query: 'coffee',
                queryType: 'NON_NEAR',
                queryTime: 42,
                numResults: 1,
                offset: 0,
                totalResults: 214,
                fuzzyLevel: 1,
            },
            results: [
                {
                    type: 'POI',
                    id: '528007001234567',
                    score: 3.5678,
                    info: 'search:ta:528007001234567-BE',
                    poi: {
                        name: 'Starbucks',
                        categorySet: [{ id: 9376006 }],
                        categories: ['coffee shop'],
                    },
                    address: {
                        streetNumber: '1',
                        streetName: 'Place de Brouckère',
                        municipality: 'Brussels',
                        countrySubdivision: 'Brussels',
                        postalCode: '1000',
                        countryCode: 'BE',
                        country: 'Belgium',
                        countryCodeISO3: 'BEL',
                        freeformAddress: '1 Place de Brouckère, 1000 Brussels',
                        localName: 'Brussels',
                    },
                    position: {
                        lat: 50.8503,
                        lon: 4.3517,
                    },
                    viewport: {
                        topLeftPoint: { lat: 50.8513, lon: 4.3507 },
                        btmRightPoint: { lat: 50.8493, lon: 4.3527 },
                    },
                },
            ],
        },
        {
            type: 'FeatureCollection',
            properties: {
                query: 'coffee',
                queryType: 'NON_NEAR',
                queryTime: 42,
                numResults: 1,
                offset: 0,
                totalResults: 214,
                fuzzyLevel: 1,
            },
            features: [
                {
                    type: 'Feature',
                    id: '528007001234567',
                    geometry: {
                        type: 'Point',
                        coordinates: [4.3517, 50.8503],
                    },
                    properties: {
                        type: 'POI',
                        score: 3.5678,
                        info: 'search:ta:528007001234567-BE',
                        address: {
                            streetNumber: '1',
                            streetName: 'Place de Brouckère',
                            municipality: 'Brussels',
                            countrySubdivision: 'Brussels',
                            postalCode: '1000',
                            countryCode: 'BE',
                            country: 'Belgium',
                            countryCodeISO3: 'BEL',
                            freeformAddress: '1 Place de Brouckère, 1000 Brussels',
                            localName: 'Brussels',
                        },
                        poi: {
                            name: 'Starbucks',
                            localizedCategories: ['coffee shop'],
                            categories: ['COFFEE_SHOP'],
                        },
                    },
                },
            ],
        },
    ],
];
