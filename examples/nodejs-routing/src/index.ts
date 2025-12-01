import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { calculateRoute } from '@tomtom-org/maps-sdk/services';
import { API_KEY } from './config';

TomTomConfig.instance.put({ apiKey: API_KEY });

(async () => {
    const response = await calculateRoute({
        locations: [
            [4.89066, 52.37317],
            [4.47059, 51.92291],
        ],
    });
    console.log(JSON.stringify(response.features[0].properties, null, 4));
})();
