import { expect } from 'vitest';
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
            summary: {
                queryTime: 15,
                numResults: 1,
            },
            addresses: [
                {
                    address: {
                        streetName: 'Hierderweg',
                        countryCode: 'NL',
                        countrySubdivision: 'Gelderland',
                        municipality: 'Nunspeet',
                        postalCode: '8077',
                        municipalitySubdivision: 'Hulshorst',
                        country: 'Nederland',
                        countryCodeISO3: 'NLD',
                        freeformAddress: 'Hierderweg, 8077 Hulshorst',
                        boundingBox: {
                            northEast: '52.336436,5.739380',
                            southWest: '52.334605,5.722876',
                            entity: 'position',
                        },
                        localName: 'Hulshorst',
                        sideOfStreet: 'R',
                        offsetPosition: '52.33516,5.72879',
                    },
                    mapcodes: [
                        {
                            type: 'Local',
                            fullMapcode: 'US-CA FS.WRG0',
                            territory: 'US-CA',
                            code: 'FS.WRG0',
                        },
                        {
                            type: 'International',
                            fullMapcode: 'S4ZW4.89XV',
                        },
                        {
                            type: 'Alternative',
                            fullMapcode: 'USA JJCH.H9CF',
                            territory: 'USA',
                            code: 'JJCH.H9CF',
                        },
                    ],
                    position: '52.335152,5.728785',
                    dataSources: {
                        geometry: {
                            id: '00005858-5800-1200-0000-0000773670cd',
                        },
                    },
                },
            ],
        },
        {
            type: 'Feature',
            id: expect.any(String),
            geometry: {
                type: 'Point',
                coordinates: [5.72884, 52.33499],
            },
            bbox: [5.722876, 52.334605, 5.73938, 52.336436],
            properties: {
                type: 'Street',
                address: {
                    streetName: 'Hierderweg',
                    countryCode: 'NL',
                    countrySubdivision: 'Gelderland',
                    municipality: 'Nunspeet',
                    postalCode: '8077',
                    municipalitySubdivision: 'Hulshorst',
                    country: 'Nederland',
                    countryCodeISO3: 'NLD',
                    freeformAddress: 'Hierderweg, 8077 Hulshorst',
                    localName: 'Hulshorst',
                },
                dataSources: {
                    geometry: {
                        id: '00005858-5800-1200-0000-0000773670cd',
                    },
                },
                mapcodes: [
                    {
                        type: 'Local',
                        fullMapcode: 'US-CA FS.WRG0',
                        territory: 'US-CA',
                        code: 'FS.WRG0',
                    },
                    {
                        type: 'International',
                        fullMapcode: 'S4ZW4.89XV',
                    },
                    {
                        type: 'Alternative',
                        fullMapcode: 'USA JJCH.H9CF',
                        territory: 'USA',
                        code: 'JJCH.H9CF',
                    },
                ],
                sideOfStreet: 'R',
                offsetPosition: [5.72879, 52.33516],
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
            summary: {
                queryTime: 15,
                numResults: 1,
            },
            addresses: [
                {
                    address: {
                        countryCode: 'NL',
                        country: 'Nederland',
                        countryCodeISO3: 'NLD',
                        freeformAddress: 'Nederland',
                        boundingBox: {
                            northEast: '53.555013,7.227545',
                            southWest: '50.750449,3.358334',
                            entity: 'position',
                        },
                        sideOfStreet: 'L',
                        offsetPosition: '0,0',
                    },
                    position: '52.334991,5.728840',
                    dataSources: {
                        geometry: {
                            id: '00005858-5800-1200-0000-0000773670cd',
                        },
                    },
                    entityType: 'Geography',
                },
            ],
        },
        {
            type: 'Feature',
            id: expect.any(String),
            geometry: {
                type: 'Point',
                coordinates: [5.72884, 52.33499],
            },
            bbox: [3.358334, 50.750449, 7.227545, 53.555013],
            properties: {
                type: 'Geography',
                address: {
                    countryCode: 'NL',
                    country: 'Nederland',
                    countryCodeISO3: 'NLD',
                    freeformAddress: 'Nederland',
                },
                dataSources: {
                    geometry: {
                        id: '00005858-5800-1200-0000-0000773670cd',
                    },
                },
                originalPosition: [5.72884, 52.334991],
            },
        },
    ],
];

export default data;
