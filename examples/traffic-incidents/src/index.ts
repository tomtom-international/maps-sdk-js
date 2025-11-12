import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { TomTomMap, TrafficIncidentsModule } from '@tomtom-org/maps-sdk/map';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES, language: 'en-US' });

const map = new TomTomMap({ container: 'maps-sdk-js-examples-map-container', center: [2.34281, 48.85639], zoom: 12 });
await TrafficIncidentsModule.get(map, { visible: true });
