import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { PlacesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { geocodeOne } from '@tomtom-org/maps-sdk/services';
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';
import type { LngLatLike } from 'maplibre-gl';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

const location = await geocodeOne('Amsterdam Centraal, Netherlands');

const map = new TomTomMap({
    container: 'maps-sdk-js-examples-map-container',
    center: location.geometry.coordinates as LngLatLike,
    zoom: 17,
});

const placesModule = await PlacesModule.get(map);
await placesModule.show(location);
