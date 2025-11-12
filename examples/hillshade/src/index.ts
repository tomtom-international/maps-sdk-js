import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { HillshadeModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES, language: 'en-US' });

const map = new TomTomMap({ container: 'maps-sdk-js-examples-map-container', center: [11.108922, 47.109197], zoom: 7 });
await HillshadeModule.get(map, { visible: true });
