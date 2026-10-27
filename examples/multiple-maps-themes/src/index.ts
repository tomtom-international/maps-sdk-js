import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { type StandardStyleID, StylingFoundationsModule, standardStyleIDs, TomTomMap } from '@tomtom-org/maps-sdk/map';
import './style.css';
import { API_KEY } from './config';
import { addMapTile } from './mapTile';
import { syncCameras } from './syncCameras';
import { themesByStyle } from './themes';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

const INITIAL_STYLE: StandardStyleID = 'streetLight';

(async () => {
    const grid = document.querySelector('#ui-map-grid') as HTMLElement;
    const tiles = themesByStyle[INITIAL_STYLE].map(() => addMapTile(grid));
    const maps = tiles.map(
        ({ container }) =>
            new TomTomMap({ style: INITIAL_STYLE, mapLibre: { container, center: [4.8897, 52.3702], zoom: 13.5 } }),
    );
    const stylings = await Promise.all(maps.map((map) => StylingFoundationsModule.get(map)));
    syncCameras(maps);

    // `applyConfig` replaces the whole config, so the colours a theme leaves out go back to the style's own.
    const applyThemes = (style: StandardStyleID) =>
        themesByStyle[style].forEach(({ name, colors }, index) => {
            tiles[index].title.textContent = name;
            stylings[index].applyConfig({ colors });
        });
    applyThemes(INITIAL_STYLE);

    const styleSelector = document.querySelector('#ui-map-style') as HTMLSelectElement;
    standardStyleIDs.forEach((id) => styleSelector.add(new Option(id, id, id === INITIAL_STYLE, id === INITIAL_STYLE)));
    styleSelector.addEventListener('change', () => {
        const style = standardStyleIDs.find((id) => id === styleSelector.value);
        if (!style) return;

        // Set before the switch, the themes carry into the new style and land with its first frame.
        applyThemes(style);
        maps.forEach((map) => map.setStyle(style));
    });
})();
