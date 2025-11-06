import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { PlacesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { reverseGeocode } from '@tomtom-org/maps-sdk/services';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

const location = await reverseGeocode({ position: [5.112969, 52.090521] });

const map = new TomTomMap({
    container: 'maps-sdk-js-examples-map-container',
    center: location.geometry.coordinates,
    zoom: 17,
});

const placesModule = await PlacesModule.get(map);
placesModule.show(location);
