import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { type MapColors, StylingFoundationsModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

// A Lisbon summer: limestone streets, Atlantic water, olive groves and terracotta main roads.
const lisbonSummer: MapColors = {
    land: '#f6f1e7',
    water: '#9ccfdc',
    vegetation: '#cfd9b4',
    park: '#d5e0b9',
    artificial: '#efe7da',
    roadMajor: '#e8a07f',
    road: '#fffdf8',
    roadOutline: '#d9cbb6',
    label: '#4e3426',
    labelHalo: '#fffdf8',
};

(async () => {
    const map = new TomTomMap({
        mapLibre: { container: 'sdk-map', center: [-9.1393, 38.7223], zoom: 13 },
    });
    const styling = await StylingFoundationsModule.get(map);
    styling.setMapColors(lisbonSummer);
})();
