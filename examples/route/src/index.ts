import type { Waypoint } from '@cet/maps-sdk-js/core';
import { bboxFromGeoJSON, TomTomConfig } from '@cet/maps-sdk-js/core';
import { RoutingModule, TomTomMap, TrafficIncidentsModule } from '@cet/maps-sdk-js/map';
import { calculateRoute, geocode } from '@cet/maps-sdk-js/services';
import type { LngLatBoundsLike } from 'maplibre-gl';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

const waypoints: Waypoint[] = (
    await Promise.all([
        geocode({ query: 'W Houston St 51, NY', limit: 1 }),
        geocode({ query: '43rd Avenue, NY', limit: 1 }),
        geocode({ query: 'Terminal C Departures LaGuardia Airport, NY', limit: 1 }),
    ])
).map((result) => result.features[0]);
// inserting a soft waypoint before the destination:
// TODO: Orbis routing does not support soft waypoints yet and might never support them:
// waypoints.splice(2, 0, asSoftWaypoint([-73.87631, 40.76309], 20));

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
routingModule.showRoutes(await calculateRoute({ geoInputs: waypoints }));
