import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { type StandardStyleID, standardStyleIDs, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { Landmarks3D, type Landmarks3DDisplayMode } from '@tomtom-org/maps-sdk-plugin-landmarks-3d';
import './style.css';
import { API_KEY } from './config';
import { initTogglePanel } from './togglePanel';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

const map = new TomTomMap({
    mapLibre: {
        container: 'sdk-map',
        center: [4.8969, 52.3757],
        zoom: 15.94,
        pitch: 66,
        bearing: 8,
    },
});

map.mapLibreMap.setMaxPitch(80);

// Streams Orbis 3D Landmarks tiles
const landmarks = new Landmarks3D(map, { displayMode: 'inherited' });

document.querySelectorAll<HTMLInputElement>('input[name="displayMode"]').forEach((radio) => {
    radio.addEventListener('change', async () => {
        await landmarks.setDisplayMode(radio.value as Landmarks3DDisplayMode);
    });
});

const basemapSelector = document.querySelector('#sdk-example-basemap') as HTMLSelectElement;
standardStyleIDs.forEach((id) => basemapSelector.add(new Option(id)));
basemapSelector.addEventListener('change', (event) =>
    map.setStyle((event.target as HTMLSelectElement).value as StandardStyleID),
);

initTogglePanel();
