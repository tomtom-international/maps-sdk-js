import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import './style.css';
import { API_KEY } from './config';
import { initKindPicker } from './kindPicker';
import { landmarkKinds } from './landmarks';
import { addLandmarkTile } from './landmarkTile';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

const grid = document.querySelector('#ui-map-grid') as HTMLElement;
const tiles = landmarkKinds[0].landmarks.map((landmark) => addLandmarkTile(grid, landmark));

// The same four maps move to the next landmarks: a page can hold only so many WebGL contexts.
initKindPicker(document.querySelector('#ui-landmark-kinds') as HTMLElement, landmarkKinds, ({ landmarks }) =>
    tiles.forEach((tile, index) => tile.show(landmarks[index])),
);
