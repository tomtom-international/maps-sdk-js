import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { CustomGeoJSONModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import './style.css';
import { API_KEY } from './config';
import { triangleLayers } from './layers';
import { paintLegend } from './legend';
import { initTimingSliders } from './timings';
import { triangleGrid } from './triangles';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

const center: [number, number] = [4.8952, 52.3702];
const columns = 13;
const rows = 5;

const map = new TomTomMap({
    mapLibre: {
        container: 'sdk-map',
        center,
        zoom: 14,
        // The arrow keys move the clicked triangle instead of the map
        keyboard: false,
    },
});

paintLegend();
initTimingSliders(map);

(async () => {
    const triangles = await CustomGeoJSONModule.create(map, {
        sources: { triangles: { layers: triangleLayers } },
    });

    await triangles.show(triangleGrid(center, columns, rows, 450), 'triangles');

    // The SDK tracks event states only on sources with a handler registered.
    triangles.events.triangles.on('click', () => {});

    const moves: Record<string, [number, number]> = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, 1],
        ArrowDown: [0, -1],
    };
    document.addEventListener('keydown', (event) => {
        if (event.target instanceof HTMLInputElement) return;
        if (event.key === 'Escape') {
            triangles.clearEventStates({ states: ['click'] });
            return;
        }
        const move = moves[event.key];
        if (!move) return;

        // Whichever triangle was clicked last, by the pointer or by a key
        const [clicked] = triangles.getEventStates().click ?? [];
        if (clicked === undefined) {
            triangles.setEventState({ id: 0, state: 'click' });
            return;
        }
        const column = (Number(clicked) % columns) + move[0];
        const row = Math.floor(Number(clicked) / columns) + move[1];
        if (column < 0 || column >= columns || row < 0 || row >= rows) return;
        triangles.setEventState({ id: row * columns + column, state: 'click' });
    });
})();
