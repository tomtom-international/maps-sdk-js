import type { ReverseGeocodingResponse } from '../reverseGeocoding';
import type { ReverseGeocodingResponseAPI } from '../types/apiTypes';
import type { ReverseGeocodingParams } from '../types/reverseGeocodingParams';

const data: [string, ReverseGeocodingParams, ReverseGeocodingResponseAPI, ReverseGeocodingResponse][] = [
    [
        'Address example 0',
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
            id: '00005858-5800-1200-0000-0000773670cd',
            geometry: {
                type: 'Point',
                coordinates: [5.72884, 52.33499],
            },
            properties: {
                type: 'Street',
                address: {
                    freeformAddress: 'Hierderweg, 8077 Hulshorst',
                    streetName: 'Hierderweg',
                    countryCode: 'NL',
                    countryCodeISO3: 'NLD',
                    countrySubdivision: 'Gelderland',
                    municipality: 'Nunspeet',
                    postalCode: '8077',
                    municipalitySubdivision: 'Hulshorst',
                    country: 'Nederland',
                },
                originalPosition: [5.728785, 52.335152],
            },
        },
    ],
    [
        'Country example 0',
        {
            position: [5.72884, 52.33499],
            geographyType: ['Country'],
        },
        {
            results: [
                {
                    id: '00004732-3100-3c00-0000-0000240fa19a',
                    type: 'area',
                    areaType: 'country',
                    title: 'Nederland',
                    position: { type: 'Point', coordinates: [5.72884, 52.334991] },
                    address: {
                        countryCodeIso2: 'NL',
                        country: 'Nederland',
                    },
                },
            ],
        },
        {
            type: 'Feature',
            id: '00004732-3100-3c00-0000-0000240fa19a',
            geometry: {
                type: 'Point',
                coordinates: [5.72884, 52.33499],
            },
            properties: {
                type: 'Geography',
                geographyType: ['Country'],
                dataSources: { geometry: { id: '00004732-3100-3c00-0000-0000240fa19a' } },
                address: {
                    freeformAddress: 'Nederland',
                    countryCode: 'NL',
                    countryCodeISO3: 'NLD',
                    country: 'Nederland',
                },
                originalPosition: [5.72884, 52.334991],
            },
        },
    ],
];

export default data;
