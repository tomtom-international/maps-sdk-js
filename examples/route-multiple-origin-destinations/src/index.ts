import { bboxFromCoordsArray, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { RoutingModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { calculateRoute } from '@tomtom-org/maps-sdk/services';
import './style.css';
import { API_KEY } from './config';
import { routeColors, routePairs } from './coordinates';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY });

(async () => {
    const map = new TomTomMap({
        container: 'sdk-map',
        bounds: bboxFromCoordsArray(routePairs.flat()),
        fitBoundsOptions: { padding: 100 },
    });

    // Create routing modules dynamically for each route pair
    const routingModules = await Promise.all(
        routePairs.map((_, index) => RoutingModule.get(map, { theme: { mainColor: routeColors[index] } })),
    );

    // Calculate and display routes for each origin-destination pair
    for (let i = 0; i < routePairs.length; i++) {
        const locations = routePairs[i];
        const routingModule = routingModules[i];

        await routingModule.showWaypoints(locations);

        const route = await calculateRoute({ locations, costModel: { traffic: 'historical' } });

        await routingModule.showRoutes(route);
    }
})();
