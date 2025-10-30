import type { Waypoint } from '@tomtom-org/maps-sdk-js/core';
import { bboxFromGeoJSON, TomTomConfig } from '@tomtom-org/maps-sdk-js/core';
import { RoutingModule, TomTomMap, TrafficIncidentsModule } from '@tomtom-org/maps-sdk-js/map';
import { calculateRoute, geocodeOne } from '@tomtom-org/maps-sdk-js/services';
import type { LngLatBoundsLike } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

const waypoints: Waypoint[] = await Promise.all([geocodeOne('London'), geocodeOne('Paris')]);

const map = new TomTomMap(
    {
        container: 'maps-sdk-js-examples-map-container',
        bounds: bboxFromGeoJSON(waypoints) as LngLatBoundsLike,
        fitBoundsOptions: { padding: 200 },
    },
    { style: { type: 'standard', include: ['trafficIncidents'] } },
);
await TrafficIncidentsModule.get(map, { visible: false });

const routingModule = await RoutingModule.get(map, { theme: { mainColor: '#DF1B12' } });
routingModule.showWaypoints(waypoints);
routingModule.showRoutes(await calculateRoute({ locations: waypoints }));
