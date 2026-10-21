import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { type MapRequestTransform, TomTomMap } from '@tomtom-org/maps-sdk/map';
import './style.css';
import { API_KEY } from './config';
import { initTogglePanel } from './togglePanel';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY });

const holdToggle = document.querySelector('#ui-hold') as HTMLInputElement;
const releasedCount = document.querySelector('#ui-released') as HTMLElement;
const heldCount = document.querySelector('#ui-held') as HTMLElement;

let released = 0;
let held = 0;
let releaseHeld = () => {};
let tilesReleased = Promise.resolve();

const showCounts = () => {
    releasedCount.textContent = String(released);
    heldCount.textContent = String(held);
};

const holdTiles: MapRequestTransform = async (request, resourceType) => {
    if (resourceType === 'Tile') {
        held++;
        showCounts();
        await tilesReleased;
        held--;
        released++;
        showCounts();
    }
    return request;
};

new TomTomMap({
    transformRequest: holdTiles,
    mapLibre: {
        container: 'sdk-map',
        center: [4.8986, 52.3731],
        zoom: 13,
    },
});

holdToggle.addEventListener('change', () => {
    if (holdToggle.checked) {
        tilesReleased = new Promise((resolve) => {
            releaseHeld = resolve;
        });
    } else {
        releaseHeld();
    }
});

initTogglePanel();
