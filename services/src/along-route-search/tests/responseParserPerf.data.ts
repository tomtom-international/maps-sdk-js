import type { AlongRouteSearchResponseAPI } from '../types';

export const apiResponses: Array<[string, AlongRouteSearchResponseAPI]> = [
    [
        'Performance Test',
        {
            summary: {
                query: 'restaurant',
                queryType: 'NON_NEAR',
                queryTime: 78,
                numResults: 10,
                offset: 0,
                totalResults: 243,
                fuzzyLevel: 1,
            },
            results: [
                {
                    type: 'POI',
                    id: '528007001000001',
                    score: 4.123,
                    info: 'search:ta:528007001000001-BE',
                    poi: {
                        name: 'Restaurant De Kroon',
                        categorySet: [{ id: 7315 }],
                        categories: ['restaurant'],
                    },
                    address: {
                        streetNumber: '10',
                        streetName: 'Grote Markt',
                        municipality: 'Antwerp',
                        countrySubdivision: 'Antwerp',
                        postalCode: '2000',
                        countryCode: 'BE',
                        country: 'Belgium',
                        countryCodeISO3: 'BEL',
                        freeformAddress: '10 Grote Markt, 2000 Antwerp',
                        localName: 'Antwerp',
                    },
                    position: { lat: 51.2202, lon: 4.4023 },
                    viewport: {
                        topLeftPoint: { lat: 51.2212, lon: 4.4013 },
                        btmRightPoint: { lat: 51.2192, lon: 4.4033 },
                    },
                },
                {
                    type: 'POI',
                    id: '528007001000002',
                    score: 3.987,
                    info: 'search:ta:528007001000002-BE',
                    poi: {
                        name: 'Brasserie de la Gare',
                        categorySet: [{ id: 7315 }],
                        categories: ['restaurant'],
                    },
                    address: {
                        streetNumber: '5',
                        streetName: 'Rue de la Gare',
                        municipality: 'Liège',
                        countrySubdivision: 'Liège',
                        postalCode: '4000',
                        countryCode: 'BE',
                        country: 'Belgium',
                        countryCodeISO3: 'BEL',
                        freeformAddress: '5 Rue de la Gare, 4000 Liège',
                        localName: 'Liège',
                    },
                    position: { lat: 50.6452, lon: 5.5735 },
                    viewport: {
                        topLeftPoint: { lat: 50.6462, lon: 5.5725 },
                        btmRightPoint: { lat: 50.6442, lon: 5.5745 },
                    },
                },
            ],
        },
    ],
];
