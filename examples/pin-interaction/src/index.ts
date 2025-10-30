import { TomTomConfig } from '@tomtom-org/maps-sdk-js/core';
import { PlacesModule, TomTomMap } from '@tomtom-org/maps-sdk-js/map';
import { reverseGeocode } from '@tomtom-org/maps-sdk-js/services';
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';
import type { LngLatLike } from 'maplibre-gl';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

const position = [4.8907, 52.37311];
const map = new TomTomMap({
    container: 'maps-sdk-js-examples-map-container',
    center: position as LngLatLike,
    zoom: 17,
});

const location = await reverseGeocode({ position });
const placesModule = await PlacesModule.get(map);
placesModule.events.on('click', () => alert('pin clicked'));

placesModule.show(location);
