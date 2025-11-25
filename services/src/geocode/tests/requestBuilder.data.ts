import type { Polygon } from 'geojson';
import type { GeocodingParams } from '../types/geocodingParams';

export const geocodingReqObjectsAndUrLs: Array<[string, GeocodingParams, string]> = [
    [
        'Geocoding Request with mandatory & an optional Param - Example 1',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 1,
            commonBaseURL: 'https://api-test.tomtom.com',
            language: 'es-ES',
            query: 'amsterdam centrale',
        },
        'https://api-test.tomtom.com/maps/orbis/places/geocode/amsterdam%20centrale.json?apiVersion=1&key=GLOBAL_API_KEY&language=es-ES',
    ],
    [
        'Geocoding Request with mandatory & an optional Param - Example 2',
        {
            apiKey: 'ANOTHER_API_KEY',
            apiVersion: 1,
            commonBaseURL: 'https://api-test.tomtom.com',
            language: 'es-ES',
            query: 'amsterdam centrale',
        },
        'https://api-test.tomtom.com/maps/orbis/places/geocode/amsterdam%20centrale.json?apiVersion=1&key=ANOTHER_API_KEY&language=es-ES',
    ],
    [
        'Geocoding Request with mandatory & an optional Param - Example 3',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 1,
            commonBaseURL: 'https://api-test.tomtom.com',
            language: 'en-US',
            query: 'amsterdam centrale',
        },
        'https://api-test.tomtom.com/maps/orbis/places/geocode/amsterdam%20centrale.json?apiVersion=1&key=GLOBAL_API_KEY&language=en-US',
    ],
    [
        'Geocoding Request with mandatory & an optional Param - Example 4',
        {
            apiVersion: 1,
            commonBaseURL: 'https://api.tomtom.com',
            query: '4 north 2nd street san jose',
            apiKey: 'GIVEN_API_KEY',
            language: 'en-GB',
        },
        'https://api.tomtom.com/maps/orbis/places/geocode/4%20north%202nd%20street%20san%20jose.json?apiVersion=1&key=GIVEN_API_KEY&language=en-GB',
    ],
    [
        'Geocoding Request with mandatory & optional Params',
        {
            query: 'amsterdam central station',
            apiKey: 'ANOTHER_API_KEY',
            apiVersion: 1,
            commonBaseURL: 'https://api-test.tomtom.com',
            customServiceBaseURL: 'https://kr-api.tomtom.com/search/3/geocodeCustom',
            language: 'en-US',
            geographyTypes: ['Country', 'CountrySubdivision'],
            countries: ['NLD', 'ESP'],
            radiusMeters: 30,
            offset: 100,
            mapcodes: ['Local', 'International'],
            typeahead: true,
            limit: 20,
            position: [4.78, 51.43],
            extendedPostalCodesFor: ['Addr', 'Str'],
        },
        'https://kr-api.tomtom.com/search/3/geocodeCustom/amsterdam%20central%20station.json?apiVersion=1&key=ANOTHER_API_KEY&language=en-US&typeahead=true&limit=20&ofs=100&lat=51.43&lon=4.78&countrySet=NLD%2CESP&radius=30&extendedPostalCodesFor=Addr%2CStr&mapcodes=Local%2CInternational&entityTypeSet=Country%2CCountrySubdivision',
    ],
    [
        'Geocoding Request with BB Param - Example 1',
        {
            query: 'amsterdam central station',
            apiKey: 'ANOTHER_API_KEY',
            apiVersion: 1,
            commonBaseURL: 'https://api-test.tomtom.com',
            language: 'en-US',
            boundingBox: [5.16905, 51.85925, 5.16957, 52.44009],
        },
        'https://api-test.tomtom.com/maps/orbis/places/geocode/amsterdam%20central%20station.json?apiVersion=1&key=ANOTHER_API_KEY&language=en-US&topLeft=52.44009%2C5.16905&btmRight=51.85925%2C5.16957',
    ],
    [
        'Geocoding Request with BB Param - Example 2',
        {
            query: 'amsterdam central station',
            apiKey: 'ANOTHER_API_KEY',
            apiVersion: 1,
            commonBaseURL: 'https://api-test.tomtom.com',
            language: 'en-US',
            boundingBox: {
                type: 'Polygon',
                coordinates: [
                    [
                        [5.16905, 52.44009],
                        [5.16957, 52.44009],
                        [5.16957, 51.85925],
                        [5.16905, 51.85925],
                        [5.16905, 52.44009],
                    ],
                ],
            } as Polygon,
        },
        'https://api-test.tomtom.com/maps/orbis/places/geocode/amsterdam%20central%20station.json?apiVersion=1&key=ANOTHER_API_KEY&language=en-US&topLeft=52.44009%2C5.16905&btmRight=51.85925%2C5.16957',
    ],
    [
        'Geocoding Request without API Key nor version',
        {
            commonBaseURL: 'https://api.tomtom.com',
            query: '4 north 2nd street san jose',
        },
        'https://api.tomtom.com/maps/orbis/places/geocode/4%20north%202nd%20street%20san%20jose.json?apiVersion=undefined&key=undefined',
    ],
    [
        'Geocoding Request with optional params',
        {
            commonBaseURL: 'https://api.tomtom.com',
            query: '4 north 2nd street san jose',
            apiKey: 'GIVEN_API_KEY',
            apiVersion: 2,
            language: 'en-GB',
            radiusMeters: 50,
            typeahead: true,
            limit: 10,
            position: [5.32, 52.5],
            view: 'AR',
            extendedPostalCodesFor: ['Addr', 'Str'],
        },
        'https://api.tomtom.com/maps/orbis/places/geocode/4%20north%202nd%20street%20san%20jose.json?apiVersion=2&key=GIVEN_API_KEY&language=en-GB&typeahead=true&limit=10&lat=52.5&lon=5.32&radius=50&extendedPostalCodesFor=Addr%2CStr&view=AR',
    ],
];
