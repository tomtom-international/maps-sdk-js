import { TomTomConfig, type Waypoint } from '@tomtom-org/maps-sdk/core';
import { calculateRoute, geocodeOne, search } from '@tomtom-org/maps-sdk/services';
import { API_KEY } from './config';

TomTomConfig.instance.put({ apiKey: API_KEY });

(async () => {
    const waypoints: Waypoint[] = await Promise.all(['Amsterdam', 'Utrecht'].map(geocodeOne));
    const routes = await calculateRoute({ locations: waypoints });

    const results = await search({
        poiCategories: ['ELECTRIC_VEHICLE_STATION'],
        route: routes.features[0],
        maxDetourTimeSeconds: 60,
        minPowerKW: 150,
        limit: 5,
    });

    console.log(`Found ${results.features.length} results along the route\n`);

    results.features.forEach((place) => {
        console.log(
            `${place.properties.poi?.name}\n${place.properties.address.freeformAddress}\n${place.geometry.coordinates}\n`,
        );
    });
})();
