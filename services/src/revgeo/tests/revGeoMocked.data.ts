import type { ReverseGeocodingResponse } from '../reverseGeocoding';
import type { ReverseGeocodingResponseAPI } from '../types/apiTypes';
import type { ReverseGeocodingParams } from '../types/reverseGeocodingParams';

type RevGeoMockedTestCase = [
    name: string,
    params: ReverseGeocodingParams,
    apiResponse: ReverseGeocodingResponseAPI,
    expectedParsedResponse: ReverseGeocodingResponse,
];

const revGeoMockedData: RevGeoMockedTestCase[] = [
    [
        'Default reverse geocoding',
        {
            position: [5.72884, 52.33499],
        },
        {
            results: [
                {
                    id: '00005858-5800-1200-0000-0000773670cd',
                    type: 'street',
                    title: 'Hierderweg, 8077 Hulshorst',
                    position: { type: 'Point', coordinates: [5.728785, 52.335152] },
                    address: {
                        routeNumbers: [],
                        street: 'Hierderweg',
                        countryCodeIso2: 'NL',
                        countrySubdivision: 'Gelderland',
                        municipality: 'Nunspeet',
                        postalCode: '8077',
                        municipalitySubdivision: 'Hulshorst',
                        country: 'Nederland',
                    },
                },
            ],
        },
        {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [5.72884, 52.33499],
            },
            properties: {
                type: 'Street',
                address: {
                    routeNumbers: [],
                    streetName: 'Hierderweg',
                    countryCode: 'NL',
                    countryCodeISO3: 'NLD',
                    countrySubdivision: 'Gelderland',
                    municipality: 'Nunspeet',
                    postalCode: '8077',
                    municipalitySubdivision: 'Hulshorst',
                    country: 'Nederland',
                    freeformAddress: 'Hierderweg, 8077 Hulshorst',
                } as any,
                originalPosition: [5.728785, 52.335152],
            },
        } as any,
    ],
    [
        'Default reverse geocoding - Korea',
        {
            position: [126.97367, 37.57435],
            customServiceBaseURL: 'https://kr-api.tomtom.com/maps/orbis/places/reverseGeocode',
        },
        {
            results: [
                {
                    id: '00005858-5800-1200-0000-0000773670ce',
                    type: 'address',
                    title: '03170 서울특별시 서울특별시 새문안로5가길 28 종로구',
                    position: { type: 'Point', coordinates: [126.97332, 37.574394] },
                    address: {
                        houseNumber: '28',
                        routeNumbers: [],
                        street: '새문안로5가길',
                        countryCodeIso2: 'KR',
                        countrySubdivision: '서울특별시',
                        municipality: '서울특별시',
                        postalCode: '03170',
                        municipalitySubdivision: '종로구',
                        country: '대한민국',
                    },
                },
            ],
        },
        {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [126.97367, 37.57435],
            },
            properties: {
                type: 'Point Address',
                address: {
                    streetNumber: '28',
                    routeNumbers: [],
                    streetName: '새문안로5가길',
                    countryCode: 'KR',
                    countryCodeISO3: 'KOR',
                    countrySubdivision: '서울특별시',
                    municipality: '서울특별시',
                    postalCode: '03170',
                    municipalitySubdivision: '종로구',
                    country: '대한민국',
                    freeformAddress: '03170 서울특별시 서울특별시 새문안로5가길 28 종로구',
                } as any,
                originalPosition: [126.97332, 37.574394],
            },
        } as any,
    ],
    [
        'Reverse geocoding for coordinates in middle of an ocean with a radius of 80Kms',
        {
            position: [-36.491432, -54.283085],
            radiusMeters: 80000,
        },
        {
            results: [
                {
                    id: '00005858-5800-1200-0000-0000773670cf',
                    type: 'street',
                    title: 'Islas Georgias Del Sur',
                    position: { type: 'Point', coordinates: [-36.491432, -54.283085] },
                    address: {
                        routeNumbers: [],
                        countryCodeIso2: 'GS',
                        municipality: 'Islas Georgias Del Sur',
                        country: 'South Georgia and the South Sandwich Islands',
                    },
                },
            ],
        },
        {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [-36.491432, -54.283085],
            },
            properties: {
                type: 'Street',
                address: {
                    routeNumbers: [],
                    countryCode: 'GS',
                    countryCodeISO3: 'SGS',
                    municipality: 'Islas Georgias Del Sur',
                    country: 'South Georgia and the South Sandwich Islands',
                    freeformAddress: 'Islas Georgias Del Sur',
                } as any,
                originalPosition: [-36.491432, -54.283085],
            },
        } as any,
    ],
    [
        'Reverse geocoding with house number input',
        {
            position: [5.149537, 52.352848],
        },
        {
            results: [
                {
                    id: '00005858-5800-1200-0000-0000773670d0',
                    type: 'address',
                    title: 'Balderstraat 22, 1363 WH Almere',
                    position: { type: 'Point', coordinates: [5.149537, 52.352848] },
                    address: {
                        houseNumber: '22',
                        routeNumbers: [],
                        street: 'Balderstraat',
                        countryCodeIso2: 'NL',
                        countrySubdivision: 'Flevoland',
                        municipality: 'Almere',
                        postalCode: '1363',
                        country: 'Nederland',
                        extendedPostalCode: '1363 WH',
                    },
                    accessPoints: [{ position: { type: 'Point', coordinates: [5.149493, 52.352901] } }],
                },
            ],
        },
        {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [5.149537, 52.352848],
            },
            properties: {
                type: 'Point Address',
                address: {
                    streetNumber: '22',
                    routeNumbers: [],
                    streetName: 'Balderstraat',
                    countryCode: 'NL',
                    countryCodeISO3: 'NLD',
                    countrySubdivision: 'Flevoland',
                    municipality: 'Almere',
                    postalCode: '1363',
                    country: 'Nederland',
                    extendedPostalCode: '1363 WH',
                    freeformAddress: 'Balderstraat 22, 1363 WH Almere',
                } as any,
                entryPoints: [{ position: [5.149493, 52.352901] }],
                originalPosition: [5.149537, 52.352848],
            },
        } as any,
    ],
    [
        'Localized municipality reverse geocoding',
        {
            position: [-3.140351, 55.947106],
            geographyType: ['Municipality'],
        },
        {
            results: [
                {
                    id: '00004732-3100-3c00-0000-0000240fa19a',
                    type: 'area',
                    areaType: 'municipality',
                    title: 'Édimbourg',
                    position: { type: 'Point', coordinates: [-3.140351, 55.947105] },
                    address: {
                        routeNumbers: [],
                        countryCodeIso2: 'GB',
                        countrySubdivision: 'SCT',
                        countrySecondarySubdivision: 'Midlothian',
                        municipality: 'Édimbourg',
                        country: 'Royaume-Uni',
                    },
                },
            ],
        },
        {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [-3.140351, 55.947106],
            },
            properties: {
                type: 'Geography',
                geographyType: ['Municipality'],
                dataSources: { geometry: { id: '00004732-3100-3c00-0000-0000240fa19a' } },
                address: {
                    routeNumbers: [],
                    countryCode: 'GB',
                    countryCodeISO3: 'GBR',
                    countrySubdivision: 'SCT',
                    countrySecondarySubdivision: 'Midlothian',
                    municipality: 'Édimbourg',
                    country: 'Royaume-Uni',
                    freeformAddress: 'Édimbourg',
                } as any,
                originalPosition: [-3.140351, 55.947105],
            },
        } as any,
    ],
];

export default revGeoMockedData;
