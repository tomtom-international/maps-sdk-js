'use strict';
require('dotenv').config({ path: '../.env' });

const search = require('@tomtom-org/maps-sdk-js/services').search;
const TomTomConfig = require('@tomtom-org/maps-sdk-js/core').TomTomConfig;

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

search({
    query: 'cafe',
    geometries: [
        {
            type: 'Polygon',
            coordinates: [
                [
                    [-122.43576, 37.75241],
                    [-122.43301, 37.7066],
                    [-122.36434, 37.71205],
                    [-122.37396, 37.7535],
                ],
            ],
        },
    ],
}).then((response) => console.log('Example for cafes in San Francisco area:\n', JSON.stringify(response, null, 4)));

search({
    query: 'restaurant',
    poiCategories: ['MEXICAN_RESTAURANT', 'ITALIAN_RESTAURANT'],
    geometries: [
        {
            type: 'Polygon',
            coordinates: [
                [
                    [-122.43576, 37.75241],
                    [-122.43301, 37.7066],
                    [-122.36434, 37.71205],
                    [-122.37396, 37.7535],
                ],
            ],
        },
    ],
}).then((response) =>
    console.log(
        'Example for restricting the results to Mexican and Italian restaurants only:\n',
        JSON.stringify(response, null, 4),
    ),
);
