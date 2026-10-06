import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import {
    applyMapPreset,
    BaseMapModule,
    baseMapKnobCatalogue,
    type MapPresetId,
    mapPresetCatalogue,
    POIsModule,
    poisKnobCatalogue,
    resetKnob,
    StandardStyleID,
    StylingFoundationsModule,
    standardStyleIDs,
    stylingFoundationsKnobCatalogue,
    TerrainModule,
    TomTomMap,
    TrafficFlowModule,
    TrafficIncidentsModule,
    terrainKnobCatalogue,
    trafficFlowKnobCatalogue,
    trafficIncidentsKnobCatalogue,
} from '@tomtom-org/maps-sdk/map';
import './style.css';
import { initBaseMapGroupsPanel } from './baseMapGroupsPanel';
import { API_KEY } from './config';
import { initLayerEdits } from './layerEdits';
import { initStylingPanel, type LookKnobSource } from './stylingPanel';
import { initTogglePanel } from './togglePanel';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

(async () => {
    // San Francisco: hills for the shading knobs, traffic for the congestion colours, and water,
    // ferries and rail for the base-map groups.
    const map = new TomTomMap({
        mapLibre: { container: 'sdk-map', center: [-122.4372, 37.7652], zoom: 12.6 },
    });
    const [trafficFlow, trafficIncidents, pois, baseMap] = await Promise.all([
        TrafficFlowModule.get(map, { visible: true }),
        TrafficIncidentsModule.get(map),
        POIsModule.get(map),
        BaseMapModule.get(map),
    ]);
    // The standard styles fade the shading out by zoom 13; these keep it at every zoom.
    const terrain = await TerrainModule.get(map, { hillshade: { visible: true, exaggeration: 0.5, maxZoom: 22 } });
    const styling = await StylingFoundationsModule.get(map, { 'labels.sizeFactor': 1.2 });

    // How the map looks is held by the module drawing each part: the foundations by StylingFoundationsModule,
    // road markings by BaseMapModule, and the POI, traffic and hillshade looks by their own modules.
    const isTrafficLook = (id: string) => id.startsWith('colors.') || id === 'widthFactor';
    const lookSources: LookKnobSource[] = [
        { module: styling, catalogue: stylingFoundationsKnobCatalogue },
        { module: baseMap, catalogue: baseMapKnobCatalogue, isLook: (id) => id.startsWith('roads.'), section: 'roads' },
        {
            module: pois,
            catalogue: poisKnobCatalogue,
            isLook: (id) => id !== 'visible' && !id.startsWith('filters.'),
            section: 'pois',
        },
        { module: trafficFlow, catalogue: trafficFlowKnobCatalogue, isLook: isTrafficLook, section: 'traffic flow' },
        {
            module: trafficIncidents,
            catalogue: trafficIncidentsKnobCatalogue,
            isLook: isTrafficLook,
            section: 'traffic incidents',
        },
        {
            module: terrain,
            catalogue: terrainKnobCatalogue,
            isLook: (id) => id.startsWith('hillshade.') && id !== 'hillshade.visible',
            section: 'hillshade',
        },
    ];
    const panel = initStylingPanel(lookSources);
    initLayerEdits(styling);

    // Showing or hiding a whole layer group is BaseMapModule's, so its toggles are a panel of their own.
    const baseMapGroups = initBaseMapGroupsPanel(baseMap);

    // Resets every look knob, keeping traffic and hillshade shown.
    document.querySelector('#ui-reset')?.addEventListener('click', () => {
        for (const { module, catalogue, isLook } of lookSources) {
            for (const { id } of catalogue) if (isLook?.(id) ?? true) resetKnob(module, catalogue, id);
        }
        baseMap.resetConfig();
    });

    // Map presets are named bundles of knob settings across the modules, listed by their catalogue too.
    const presetsSelector = document.querySelector('#ui-presets') as HTMLSelectElement;
    for (const preset of mapPresetCatalogue) {
        presetsSelector.add(new Option(preset.name, preset.id));
    }
    presetsSelector.addEventListener('change', () => {
        if (presetsSelector.value) applyMapPreset(map, presetsSelector.value as MapPresetId);
    });

    const stylesSelector = document.querySelector('#ui-mapStyles') as HTMLSelectElement;
    for (const id of standardStyleIDs) {
        stylesSelector.add(new Option(id));
    }
    stylesSelector.addEventListener('change', async (event) => {
        // Knob settings survive the switch: the module re-applies them on the new style.
        await map.setStyle((event.target as HTMLOptionElement).value as StandardStyleID);
        panel.render();
        baseMapGroups.render();
    });

    initTogglePanel();
})();
