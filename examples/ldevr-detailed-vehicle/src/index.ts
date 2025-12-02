import { bboxFromGeoJSON, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { RoutingModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { calculateRoute, geocodeOne } from '@tomtom-org/maps-sdk/services';
import { vehicle } from './vehicleParams';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY });

(async () => {
    const waypoints = await Promise.all([geocodeOne('Paris, FR'), geocodeOne('Amsterdam, NL')]);

    const map = new TomTomMap({
        container: 'sdk-map',
        bounds: bboxFromGeoJSON(waypoints),
        fitBoundsOptions: { padding: 100 },
    });

    const routingModule = await RoutingModule.get(map);
    routingModule.showWaypoints(waypoints);

    const route = await calculateRoute({ locations: waypoints, vehicle });
    routingModule.showRoutes(route);
})();
