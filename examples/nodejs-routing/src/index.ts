import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { calculateRoute } from '@tomtom-org/maps-sdk/services';

TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

(async () => {
    const response = await calculateRoute({
        locations: [
            [4.89066, 52.37317],
            [4.47059, 51.92291],
        ],
    });
    console.log(JSON.stringify(response.features[0].properties, null, 4));
})();
