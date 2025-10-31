import type { Waypoint } from '@tomtom-org/maps-sdk/core';
import { bboxFromGeoJSON, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { RoutingModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { calculateRoute, geocodeOne } from '@tomtom-org/maps-sdk/services';
import type { LngLatBoundsLike } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

const waypoints: Waypoint[] = await Promise.all([
    geocodeOne('Rotterdam'),
    geocodeOne('Amsterdam'),
    geocodeOne('Utrecht'),
]);

const map = new TomTomMap({
    container: 'maps-sdk-js-examples-map-container',
    bounds: bboxFromGeoJSON(waypoints) as LngLatBoundsLike,
    fitBoundsOptions: { padding: 100 },
});

const routingModule = await RoutingModule.get(map, {
    waypoints: { icon: { style: { fillColor: 'green', outlineColor: 'orange', outlineOpacity: 0.7 } } },
});
routingModule.showWaypoints(waypoints);
routingModule.showRoutes(await calculateRoute({ locations: waypoints }));
