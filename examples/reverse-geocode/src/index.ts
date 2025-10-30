import { TomTomConfig } from '@tomtom-org/maps-sdk-js/core';
import { PlacesModule, TomTomMap } from '@tomtom-org/maps-sdk-js/map';
import { reverseGeocode } from '@tomtom-org/maps-sdk-js/services';
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

const location = await reverseGeocode({ position: [5.112969, 52.090521] });
const {
    geometry: {
        coordinates: [longitude, latitude],
    },
} = location;

const map = new TomTomMap({
    container: 'maps-sdk-js-examples-map-container',
    center: [longitude, latitude],
    zoom: 17,
});

const placesModule = await PlacesModule.get(map);

placesModule.show(location);
