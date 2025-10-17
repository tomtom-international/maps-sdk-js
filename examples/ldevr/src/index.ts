import type { Waypoint } from '@cet/maps-sdk-js/core';
import { bboxFromGeoJSON, TomTomConfig } from '@cet/maps-sdk-js/core';
import { RoutingModule, TomTomMap } from '@cet/maps-sdk-js/map';
import { calculateRoute, geocode } from '@cet/maps-sdk-js/services';
import type { LngLatBoundsLike } from 'maplibre-gl';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

const waypoints: Waypoint[] = (
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

const route = await calculateRoute({
    geoInputs: waypoints,
    vehicle: {
        engineType: 'electric',
        model: { variantId: '54B969E8-E28D-11EC-8FEA-0242AC120002' },
        state: { currentChargeInkWh: 25 },
        preferences: {
            chargingPreferences: { minChargeAtDestinationInkWh: 5, minChargeAtChargingStopsInkWh: 5 },
        },
    },
});
routingModule.showRoutes(route);
