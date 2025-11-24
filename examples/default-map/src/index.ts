import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { TomTomMap } from '@tomtom-org/maps-sdk/map';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES, language: 'en-GB' });

(async () => {
    new TomTomMap({
        container: 'maps-sdk-js-examples-map-container',
        center: [4.8156, 52.4414],
        zoom: 8,
    });
})();
