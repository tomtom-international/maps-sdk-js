import type { Waypoint } from '@cet/maps-sdk-js/core';
import { bboxFromGeoJSON, TomTomConfig } from '@cet/maps-sdk-js/core';
import { RoutingModule, TomTomMap, TrafficIncidentsModule } from '@cet/maps-sdk-js/map';
import { calculateRoute, geocodeOne } from '@cet/maps-sdk-js/services';
import type { LngLatBoundsLike } from 'maplibre-gl';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

const waypoints: Waypoint[] = await Promise.all([
    geocodeOne('W Houston St 51, NY'),
    geocodeOne('Lincoln Square, NY'),
    geocodeOne('Carnegie Hill, NY'),
    geocodeOne('Terminal C Departures LaGuardia Airport, NY'),
]);

const map = new TomTomMap(
    {
        container: 'maps-sdk-js-examples-map-container',
        bounds: bboxFromGeoJSON(waypoints) as LngLatBoundsLike,
        fitBoundsOptions: { padding: 150 },
    },
    { style: { type: 'standard', include: ['trafficIncidents'] } },
);
await TrafficIncidentsModule.get(map, { visible: false });
const routingModule = await RoutingModule.get(map);
routingModule.showWaypoints(waypoints);
routingModule.showRoutes(await calculateRoute({ locations: waypoints }));
