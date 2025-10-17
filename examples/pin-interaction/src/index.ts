import { TomTomConfig } from '@cet/maps-sdk-js/core';
import { PlacesModule, TomTomMap } from '@cet/maps-sdk-js/map';
import { reverseGeocode } from '@cet/maps-sdk-js/services';
import { LngLat } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

const lnglat = new LngLat(4.8907, 52.37311);

const map = new TomTomMap({ container: 'maps-sdk-js-examples-map-container', center: lnglat, zoom: 17 });

const location = await reverseGeocode({ position: [lnglat.lng, lnglat.lat] });
const placesModule = await PlacesModule.init(map);
placesModule.show(location);

placesModule.events.on('click', () => alert('pin clicked'));
