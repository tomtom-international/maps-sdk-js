import { bboxFromGeoJSON, TomTomConfig } from '@cet/maps-sdk-js/core';
import { RoutingModule, TomTomMap } from '@cet/maps-sdk-js/map';
import { calculateRoute, geocodeOne } from '@cet/maps-sdk-js/services';
import type { LngLatBoundsLike } from 'maplibre-gl';
import './style.css';

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

const route = await calculateRoute({
    locations: waypoints,
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
