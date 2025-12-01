import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { search } from '@tomtom-org/maps-sdk/services';

TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

(async () => {
    const response = await search({
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
    console.log(JSON.stringify(response, null, 4));
})();
