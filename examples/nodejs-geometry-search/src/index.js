import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { search } from '@tomtom-org/maps-sdk/services';

TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES ?? '' });

(async () => {
    const cafeResponse = await search({
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
    });
    console.log('Example for cafes in San Francisco area:\n', JSON.stringify(cafeResponse, null, 4));

    const restaurantResponse = await search({
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
    });
    console.log('Example for restaurants in San Francisco area:\n', JSON.stringify(restaurantResponse, null, 4));
})();
