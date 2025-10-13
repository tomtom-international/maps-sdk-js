import { TomTomConfig } from '@cet/maps-sdk-js/core';
import { PlacesModule, TomTomMap } from '@cet/maps-sdk-js/map';
import { geocode } from '@cet/maps-sdk-js/services';
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

const location = await geocode({ query: 'Amsterdam Centraal, Netherlands' });
const {
    geometry: { coordinates },
} = location.features[0];

const map = new TomTomMap({
    container: 'maps-sdk-js-examples-map-container',
    center: [coordinates[0], coordinates[1]],
    zoom: 17,
});

const placesModule = await PlacesModule.init(map);

placesModule.show(location);

(window as any).map = map; // This has been done for automation test support
