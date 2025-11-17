import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { RoutingModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { calculateRoute, geocodeOne } from '@tomtom-org/maps-sdk/services';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

const waypoints = await Promise.all([
  geocodeOne('Leidsplein, Amsterdam'),
  geocodeOne('Damplein, Amsterdam'),
]);

const map = new TomTomMap({
  container: 'maps-sdk-js-examples-map-container',
  center: [4.8808162, 52.3665909],
  zoom: 16.6
});

const routingModule = await RoutingModule.get(map);

const routes = await calculateRoute({
    locations: waypoints,
    guidance: { // request guidance instructions
      type: 'coded'
    },
});

routingModule.showRoutes(routes);
