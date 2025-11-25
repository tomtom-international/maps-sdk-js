import type { AutocompleteSearchParams } from '../types';

const data: [string, AutocompleteSearchParams][] = [
    [
        'Performance Test',
        {
            apiKey: 'GLOBAL_API_KEY',
            commonBaseURL: 'https://api.tomtom.com',
            query: 'cafe',
            position: [2.3522, 48.8566],
            limit: 5,
            radiusMeters: 5000,
            countries: ['NLD', 'BEL'],
            language: 'nl-NL',
            resultType: ['brand', 'category'],
        },
    ],
];

export default data;
