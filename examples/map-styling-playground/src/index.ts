import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import {
    StandardStyleID,
    StylingModule,
    StylingPresetId,
    standardStyleIDs,
    TerrainModule,
    TomTomMap,
    TrafficFlowModule,
} from '@tomtom-org/maps-sdk/map';
import './style.css';
import { API_KEY } from './config';
import { initLayerEdits } from './layerEdits';
import { initStylingPanel } from './stylingPanel';
import { initTogglePanel } from './togglePanel';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

(async () => {
    // San Francisco: hills for the shading knobs, traffic for the congestion colours, and water,
    // ferries and rail for the base-map groups.
    const map = new TomTomMap({
        mapLibre: { container: 'sdk-map', center: [-122.4372, 37.7652], zoom: 12.6 },
    });
    await TrafficFlowModule.get(map, { visible: true });
    await TerrainModule.get(map, { hillshade: true });

    // The standard styles fade the shading out by zoom 13; these keep it at every zoom.
    const styling = await StylingModule.get(map, {
        'labels.sizeFactor': 1.2,
        'hillshade.exaggeration': 0.5,
        'hillshade.maxZoom': 22,
    });
    const panel = initStylingPanel(styling);
    initLayerEdits(styling);

    document.querySelector('#ui-reset')?.addEventListener('click', () => styling.reset());

    // Presets are named bundles of knob settings, listed by the catalogue too.
    const presetsSelector = document.querySelector('#ui-presets') as HTMLSelectElement;
    for (const preset of styling.describe().presets) {
        presetsSelector.add(new Option(preset.name, preset.id));
    }
    presetsSelector.addEventListener('change', () => {
        if (presetsSelector.value) styling.applyPreset(presetsSelector.value as StylingPresetId);
    });

    const stylesSelector = document.querySelector('#ui-mapStyles') as HTMLSelectElement;
    for (const id of standardStyleIDs) {
        stylesSelector.add(new Option(id));
    }
    stylesSelector.addEventListener('change', async (event) => {
        // Knob settings survive the switch: the module re-applies them on the new style.
        await map.setStyle((event.target as HTMLOptionElement).value as StandardStyleID);
        panel.render();
    });

    initTogglePanel();
})();
