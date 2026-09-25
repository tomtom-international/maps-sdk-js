import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { type StandardStyleID, TomTomMap, TrafficFlowModule, TrafficIncidentsModule } from '@tomtom-org/maps-sdk/map';
import { geocodeOne } from '@tomtom-org/maps-sdk/services';
import { MapEffects } from '@tomtom-org/maps-sdk-plugin-map-effects';
import './style.css';
import { API_KEY } from './config';
import { renderKnobPanel } from './knobPanel';
import { initStyleSelector } from './styleSelector';
import { initTogglePanel } from './togglePanel';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

const INITIAL_STYLE: StandardStyleID = 'monoDark';

(async () => {
    const manhattan = await geocodeOne('Manhattan, New York');
    const [longitude, latitude] = manhattan.geometry.coordinates;

    const map = new TomTomMap({
        style: INITIAL_STYLE,
        mapLibre: {
            container: 'sdk-map',
            center: [longitude, latitude],
            zoom: 13,
            // Bloom and capture read the map canvas back; MapLibre keeps it readable only when asked.
            canvasContextAttributes: { preserveDrawingBuffer: true },
        },
    });

    // Both traffic modules, so every scope has something of its own to light.
    await TrafficFlowModule.get(map, { visible: true });
    await TrafficIncidentsModule.get(map, { visible: true });

    const effects = new MapEffects(map, { 'bloom.intensity': 0.9, 'bloom.threshold': 0.45, 'bloom.radius': 13 });
    renderKnobPanel(effects);

    initStyleSelector(INITIAL_STYLE, (style) => map.setStyle(style));

    document.querySelector('#ui-reset')?.addEventListener('click', () => {
        effects.reset();
        renderKnobPanel(effects);
    });

    document.querySelector('#ui-capture')?.addEventListener('click', async () => {
        const canvas = await effects.capture({ pixelRatio: 2 });
        window.open()?.document.body.appendChild(canvas);
    });

    initTogglePanel();
})();
