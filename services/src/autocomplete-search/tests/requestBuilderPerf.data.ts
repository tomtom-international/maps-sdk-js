import type { AutocompleteSearchParams } from '../types';

const data: [string, AutocompleteSearchParams][] = [
    [
        'Performance Test',
        {
            apiKey: 'GLOBAL_API_KEY',
            commonBaseURL: 'https://api.tomtom.com',
            query: 'cafe',
            geoBias: { position: [2.3522, 48.8566], radiusMeters: 5000 },
            limit: 5,
            countries: ['NLD', 'BEL'],
            language: 'nl-NL',
            resultType: ['brand', 'category'],
        },
    ],
];

export default data;
