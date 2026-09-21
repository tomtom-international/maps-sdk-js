import type { ReverseGeocodingResponseAPI } from '../types/apiTypes';
import type { ReverseGeocodingParams } from '../types/reverseGeocodingParams';

const data: [string, ReverseGeocodingParams, ReverseGeocodingResponseAPI][] = [
    [
        'Performance Test',
        {
            position: [-121.974762, 36.988159],
            language: 'fr-FR',
            heading: 30,
            radiusMeters: 30,
        },
        {
            results: [
                {
                    id: '00005858-5800-1200-0000-0000773670cd',
                    type: 'address',
                    title: '2501 Soquel Drive, Santa Cruz, CA 95065',
                    position: { type: 'Point', coordinates: [-121.974762, 36.988159] },
                    address: {
                        houseNumber: '2501',
                        routeNumbers: [],
                        street: 'Soquel Drive',
                        countryCodeIso2: 'US',
                        countrySubdivision: 'CA',
                        countrySecondarySubdivision: 'Santa Cruz',
                        municipality: 'Santa Cruz',
                        postalCode: '95065',
                        municipalitySubdivision: 'Santa Cruz, Live Oak',
                        country: 'United States',
                        extendedPostalCode: '950651900',
                    },
                    accessPoints: [{ position: { type: 'Point', coordinates: [-121.974731, 36.98843] } }],
                },
            ],
        },
    ],
];

export default data;
