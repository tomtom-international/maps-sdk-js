import { bboxFromGeoJSON, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { RoutingModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { calculateRoute, geocodeOne } from '@tomtom-org/maps-sdk/services';
import type { LngLatBoundsLike } from 'maplibre-gl';
import chargerFastSVG from './charger-fast.svg?raw';
import chargerRegularSVG from './charger-regular.svg?raw';
import chargerSlowSVG from './charger-slow.svg?raw';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES, language: 'en-GB' });

const waypoints = await Promise.all([geocodeOne('Munich'), geocodeOne('Paris')]);

const map = new TomTomMap(
    {
        container: 'maps-sdk-js-examples-map-container',
        bounds: bboxFromGeoJSON(waypoints) as LngLatBoundsLike,
        fitBoundsOptions: { padding: 150 },
    },
    { style: { type: 'standard', include: ['trafficIncidents'] } },
);

const routingModule = await RoutingModule.get(map, {
    chargingStops: {
        text: {
            title: ['format', ['get', 'chargingDuration'], { 'text-color': '#243882' }],
        },
        icon: {
            customIcons: [
                { id: 'slow-speed-charger', image: chargerSlowSVG },
                { id: 'regular-speed-charger', image: chargerRegularSVG },
                { id: 'fast-speed-charger', image: chargerFastSVG },
            ],
            mapping: {
                basedOn: 'chargingSpeed',
                value: {
                    slow: 'slow-speed-charger',
                    regular: 'regular-speed-charger',
                    fast: 'fast-speed-charger',
                    'ultra-fast': 'fast-speed-charger',
                },
            },
        },
    },
});
routingModule.showWaypoints(waypoints);

const route = await calculateRoute({
    locations: waypoints,
    vehicle: {
        engineType: 'electric',
        model: { variantId: '54B969E8-E28D-11EC-8FEA-0242AC120002' },
        state: { currentChargeInkWh: 5 },
        preferences: {
            chargingPreferences: { minChargeAtDestinationInkWh: 5, minChargeAtChargingStopsInkWh: 5 },
        },
    },
});
routingModule.showRoutes(route);
