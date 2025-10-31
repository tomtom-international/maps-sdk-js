import { bboxFromGeoJSON, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { RoutingModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { calculateRoute, geocodeOne } from '@tomtom-org/maps-sdk/services';
import type { LngLatBoundsLike } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';
import { vehicle } from './vehicleParams';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

const waypoints = await Promise.all([geocodeOne('Paris, FR'), geocodeOne('Amsterdam, NL')]);

const map = new TomTomMap(
    {
        container: 'maps-sdk-js-examples-map-container',
        bounds: bboxFromGeoJSON(waypoints) as LngLatBoundsLike,
        fitBoundsOptions: { padding: 150 },
    },
    { style: { type: 'standard', include: ['trafficIncidents'] } },
);

const routingModule = await RoutingModule.get(map);
routingModule.showWaypoints(waypoints);

const route = await calculateRoute({ locations: waypoints, vehicle });
routingModule.showRoutes(route);
