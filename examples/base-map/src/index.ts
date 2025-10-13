import { TomTomConfig } from '@cet/maps-sdk-js/core';
import { TomTomMap } from '@cet/maps-sdk-js/map';
import './style.css';
import 'maplibre-gl/dist/maplibre-gl.css';

TomTomConfig.instance.put({
    // (Set your own API key when working in your own environment)
    apiKey: process.env.API_KEY_EXAMPLES,
    language: 'en-GB',
});

let map: TomTomMap;

map = new TomTomMap({
    container: 'maps-sdk-js-examples-map-container',
    center: [4.8156, 52.4414],
    zoom: 8,
});
(window as any).map = map; // This has been done for automation test support
