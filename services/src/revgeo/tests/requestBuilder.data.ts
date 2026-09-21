import type { TomTomAPIHeaders } from '@tomtom-org/maps-sdk/core';
import type { ReverseGeocodingParams } from '../types/reverseGeocodingParams';

const reverseGeocodeReqObjectsAndUrls: [string, ReverseGeocodingParams, string, TomTomAPIHeaders][] = [
    [
        'Reverse geocoding without api key nor version',
        {
            commonBaseURL: 'https://api.tomtom.com',
            position: [1.12345, 23.45678],
        },
        'https://api.tomtom.com/maps/orbis/places/reverseGeocode?position=1.12345%2C23.45678',
        { Attributes: 'results(*)' },
    ],
    [
        'Reverse geocoding using custom URL',
        {
            position: [-100.12345, -23.45678],
            apiKey: 'ANOTHER_API_KEY',
            apiVersion: 2,
            commonBaseURL: 'https://api.tomtom.com',
            customServiceBaseURL: 'https://api.tomtom.com/search/10/reverseGeocodeTest',
            language: 'en-US',
            heading: 30,
            radiusMeters: 30,
            view: 'AR',
        },
        'https://api.tomtom.com/search/10/reverseGeocodeTest?position=-100.12345%2C-23.45678&radiusInMeters=30&vehicleHeadingInDegrees=30&geopoliticalView=AR',
        {
            'TomTom-Api-Key': 'ANOTHER_API_KEY',
            'TomTom-Api-Version': '2',
            'Accept-Language': 'en-US',
            Attributes: 'results(*)',
        },
    ],
    [
        'Reverse geocoding with mandatory Params and an optional param - example 1',
        {
            position: [1.12345, 23.45678],
            apiKey: 'GIVEN_API_KEY',
            apiVersion: 4,
            commonBaseURL: 'https://api.tomtom.com',
            language: 'en-GB',
        },
        'https://api.tomtom.com/maps/orbis/places/reverseGeocode?position=1.12345%2C23.45678',
        {
            'TomTom-Api-Key': 'GIVEN_API_KEY',
            'TomTom-Api-Version': '4',
            'Accept-Language': 'en-GB',
            Attributes: 'results(*)',
        },
    ],
    [
        'Reverse geocoding with mandatory Params and an optional param - example 2',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 4,
            commonBaseURL: 'https://api-test.tomtom.com',
            language: 'es-ES',
            position: [1.12345, 23.45678],
        },
        'https://api-test.tomtom.com/maps/orbis/places/reverseGeocode?position=1.12345%2C23.45678',
        {
            'TomTom-Api-Key': 'GLOBAL_API_KEY',
            'TomTom-Api-Version': '4',
            'Accept-Language': 'es-ES',
            Attributes: 'results(*)',
        },
    ],
    [
        'Reverse geocoding with a combination of mandatory & optional params',
        {
            position: [1.12345, 23.45678],
            apiKey: 'GIVEN_API_KEY',
            apiVersion: 4,
            commonBaseURL: 'https://api.tomtom.com',
            language: 'es-ES',
            geographyType: ['Country', 'Municipality'],
            heading: 30,
            radiusMeters: 30,
            view: 'AR',
        },
        'https://api.tomtom.com/maps/orbis/places/reverseGeocode?position=1.12345%2C23.45678&radiusInMeters=30&areaTypes=country%2Cmunicipality&vehicleHeadingInDegrees=30&geopoliticalView=AR',
        {
            'TomTom-Api-Key': 'GIVEN_API_KEY',
            'TomTom-Api-Version': '4',
            'Accept-Language': 'es-ES',
            Attributes: 'results(*)',
        },
    ],
];

export default reverseGeocodeReqObjectsAndUrls;
