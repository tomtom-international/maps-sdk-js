import { TomTomConfig } from '@tomtom-org/maps-sdk-js/core';
import { TomTomMap } from '@tomtom-org/maps-sdk-js/map';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES, language: 'en-US' });

new TomTomMap(
    { container: 'maps-sdk-js-examples-map-container', center: [2.34281, 48.85639], zoom: 12 },
    { style: { type: 'standard', include: ['trafficFlow'] } },
);
