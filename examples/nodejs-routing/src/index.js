import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { calculateRoute } from '@tomtom-org/maps-sdk/services';

TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES ?? '' });

(async () => {
    // First example:
    console.log('Calculating route with default options...');
    const defaultRouteResponse = await calculateRoute({
        locations: [
            [4.89066, 52.37317],
            [4.47059, 51.92291],
        ],
    });
    console.log('\nSummary:\n', JSON.stringify(defaultRouteResponse.features[0].properties, null, 4));

    // Second example (after first example is calculated):
    console.log('Calculating Amsterdam to Leiden to Rotterdam with electric vehicle parameters...');
    const evRouteResponse = await calculateRoute({
        locations: [
            [4.89066, 52.37317],
            [4.49015, 52.16109],
            [4.47059, 51.92291],
        ],
        vehicleEngineType: 'electric',
        vehicleWeight: 1600,
        currentChargeInkWh: 40,
        maxChargeInkWh: 50,
        consumptionInkWhPerHundredKm: 15,
    });
    console.log('\nEV Route Summary:\n', JSON.stringify(evRouteResponse.features[0].properties, null, 4));
})();
