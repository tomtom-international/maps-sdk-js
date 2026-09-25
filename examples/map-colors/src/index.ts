import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { type StandardStyleID, StylingModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import './style.css';
import { API_KEY } from './config';
import { initColorPickers, initSamplePalettes, initStyleExport } from './controls';
import { initTogglePanel } from './togglePanel';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

// The style the map opens on, and the one a light palette goes back to.
const BASE_STYLE: StandardStyleID = 'standardLight';

(async () => {
    const map = new TomTomMap({
        mapLibre: { container: 'sdk-map', center: [-0.1276, 51.5072], zoom: 12 },
        style: BASE_STYLE,
    });
    const styling = await StylingModule.get(map);

    initColorPickers(styling, map);
    initSamplePalettes(styling, map, BASE_STYLE);
    initStyleExport(styling);
    initTogglePanel();
})();
