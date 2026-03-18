import { bboxFromGeoJSON, TomTomConfig, type Waypoint } from '@tomtom-org/maps-sdk/core';
import { PlacesModule, RoutingModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { calculateRoute, geocodeOne, search } from '@tomtom-org/maps-sdk/services';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-US' });

(async () => {
    const waypoints: Waypoint[] = await Promise.all(['Positano', 'Cetara'].map(geocodeOne));

    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            bounds: bboxFromGeoJSON(waypoints),
            fitBoundsOptions: { padding: 80 },
        },
    });

    const routingModule = await RoutingModule.get(map);
    routingModule.showWaypoints(waypoints);
    const routes = await calculateRoute({ locations: waypoints });
    routingModule.showRoutes(routes);

    const placesModule = await PlacesModule.get(map);
    const results = await search({
        poiCategories: ['BEACH', 'SCENIC_PANORAMIC_VIEW'],
        route: routes.features[0],
        maxDetourTimeSeconds: 60,
        limit: 20,
    });
    placesModule.show(results);
})();
