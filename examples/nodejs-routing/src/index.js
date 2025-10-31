'use strict';
require('dotenv').config({ path: '../.env' });

const calculateRoute = require('@tomtom-org/maps-sdk/services').calculateRoute;
const TomTomConfig = require('@tomtom-org/maps-sdk/core').TomTomConfig;

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

/**
 * Routing calls with {@link https://www.w3schools.com/js/js_async.asp Async-Await}
 */
const asyncAwaitExample = async () => {
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
            // Dragged point in Pijnacker
            {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [4.42788, 52.01833],
                },
                properties: {
                    radiusMeters: 20,
                },
            },
            [4.47059, 51.92291],
        ],
        sectionTypes: 'all',
        instructionsType: 'tagged',
        vehicle: {
            dimensions: {
                weightKG: 3500,
            },
            consumption: {
                engineType: 'electric',
                speedsToConsumptionsKWH: [
                    { speedKMH: 50, consumptionUnitsPer100KM: 8.2 },
                    { speedKMH: 130, consumptionUnitsPer100KM: 21.3 },
                ],
                auxiliaryPowerInkW: 1.7,
                currentChargeKWH: 43,
                maxChargeKWH: 85,
                efficiency: {
                    acceleration: 0.66,
                    deceleration: 0.91,
                    uphill: 0.74,
                    downhill: 0.73,
                },
            },
        },
    });

    console.log('\nSummary:\n', JSON.stringify(evRouteResponse.features[0].properties.summary, null, 4));
    console.log(
        '\nFirst instruction:\n',
        JSON.stringify(evRouteResponse.features[0].properties.guidance.instructions[0], null, 4),
    );
};

asyncAwaitExample();
