import type { Waypoint } from '@tomtom-org/maps-sdk/core';
import { bboxFromGeoJSON, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { RoutingModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { calculateRoute, geocodeOne } from '@tomtom-org/maps-sdk/services';
import type { LngLatBoundsLike } from 'maplibre-gl';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY });

(async () => {
    const waypoints: Waypoint[] = await Promise.all([geocodeOne('London'), geocodeOne('Paris')]);

    const map = new TomTomMap({
        container: 'sdk-map',
        bounds: bboxFromGeoJSON(waypoints) as LngLatBoundsLike,
        fitBoundsOptions: { padding: 100 },
    });

    const routingModule = await RoutingModule.get(map, { theme: { mainColor: '#DF1B12' } });
    routingModule.showWaypoints(waypoints);
    routingModule.showRoutes(await calculateRoute({ locations: waypoints }));
})();
