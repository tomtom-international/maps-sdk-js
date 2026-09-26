import type { AutocompleteSearchParams } from '../types';

const data: [string, AutocompleteSearchParams, string][] = [
    [
        'Autocomplete search with required parameters',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 1,
            commonBaseURL: 'https://api.tomtom.com',
            query: 'gas',
        },
        'https://api.tomtom.com/maps/orbis/places/autocomplete/gas.json?language=en-GB',
    ],
    [
        'Autocomplete search with required parameters & optional parameters',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 1,
            commonBaseURL: 'https://api.tomtom.com',
            query: "McDonald's",
            language: 'nl-NL',
            limit: 5,
        },
        "https://api.tomtom.com/maps/orbis/places/autocomplete/McDonald's.json?language=nl-NL&limit=5",
    ],
    [
        'Autocomplete search with specific result type and countries',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 2,
            commonBaseURL: 'https://api.tomtom.com',
            query: 'Starbucks',
            resultType: ['brand'],
            countries: ['NL', 'BE'],
        },
        'https://api.tomtom.com/maps/orbis/places/autocomplete/Starbucks.json?language=en-GB&countrySet=NL%2CBE&resultSet=brand',
    ],
];

export default data;
