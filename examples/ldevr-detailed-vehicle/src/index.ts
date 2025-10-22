import { bboxFromGeoJSON, TomTomConfig } from '@cet/maps-sdk-js/core';
import { RoutingModule, TomTomMap } from '@cet/maps-sdk-js/map';
import { calculateRoute, geocode } from '@cet/maps-sdk-js/services';
import type { LngLatBoundsLike } from 'maplibre-gl';
import './style.css';
import { vehicle } from './vehicleParams';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

const waypoints = (
    await Promise.all([geocode({ query: 'Paris, FR', limit: 1 }), geocode({ query: 'Amsterdam, NL', limit: 1 })])
).map((result) => result.features[0]);

const map = new TomTomMap(
    {
        container: 'maps-sdk-js-examples-map-container',
        bounds: bboxFromGeoJSON(waypoints) as LngLatBoundsLike,
        fitBoundsOptions: { padding: 150 },
    },
    { style: { type: 'standard', include: ['trafficIncidents'] } },
);

const routingModule = await RoutingModule.init(map);
routingModule.showWaypoints(waypoints);

const route = await calculateRoute({ geoInputs: waypoints, vehicle });
routingModule.showRoutes(route);
