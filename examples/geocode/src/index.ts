import { TomTomConfig } from '@cet/maps-sdk-js/core';
import { PlacesModule, TomTomMap } from '@cet/maps-sdk-js/map';
import { geocode } from '@cet/maps-sdk-js/services';
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';
import { LngLatLike } from 'maplibre-gl';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

const location = (await geocode({ query: 'Amsterdam Centraal, Netherlands' })).features[0];

const map = new TomTomMap({
    container: 'maps-sdk-js-examples-map-container',
    center: location.geometry.coordinates as LngLatLike,
    zoom: 17,
});

const placesModule = await PlacesModule.get(map);
placesModule.show(location);
