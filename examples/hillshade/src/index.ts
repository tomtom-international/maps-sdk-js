import { TomTomConfig } from '@cet/maps-sdk-js/core';
import { TomTomMap } from '@cet/maps-sdk-js/map';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES, language: 'en-US' });


const map = new TomTomMap(
    { container: 'maps-sdk-js-examples-map-container', center: [11.108922, 47.109197], zoom: 7 },
    { style: { type: 'standard', include: ['hillshade'] } },
);

(window as any).map = map; // This has been done for automation test support
