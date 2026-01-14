import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { RoutingModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { calculateRoute, geocodeOne } from '@tomtom-org/maps-sdk/services';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY });

(async () => {
    const waypoints = await Promise.all([geocodeOne('Leidsplein, Amsterdam'), geocodeOne('Damplein, Amsterdam')]);

    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            center: [4.8888162, 52.3728909],
            zoom: 16.6,
        },
    });

    const routingModule = await RoutingModule.get(map);

    const routes = await calculateRoute({
        locations: waypoints,
        costModel: {
            traffic: 'historical',
        },
        guidance: {
            // request guidance instructions
            type: 'coded',
        },
    });

    routingModule.showRoutes(routes);
    routingModule.showWaypoints(waypoints);
})();
