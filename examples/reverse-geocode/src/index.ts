import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { PlacesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { reverseGeocode } from '@tomtom-org/maps-sdk/services';
import './style.css';
import type { LngLatLike } from 'maplibre-gl';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

const position = [5.112969, 52.090521];
const location = await reverseGeocode({ position });

const map = new TomTomMap({
    container: 'maps-sdk-js-examples-map-container',
    center: position as LngLatLike,
    zoom: 17,
});

const placesModule = await PlacesModule.get(map);
await placesModule.show(location);
