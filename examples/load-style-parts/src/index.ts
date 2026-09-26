import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import {
    StandardStyleID,
    standardStyleIDs,
    TerrainModule,
    TomTomMap,
    TrafficFlowModule,
    TrafficIncidentsModule,
} from '@tomtom-org/maps-sdk/map';
import './style.css';
import { API_KEY } from './config';
import { initTogglePanel } from './togglePanel';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-US' });

(async () => {
    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            zoom: 13,
            minZoom: 2,
            center: [2.1493, 41.4001],
        },
        style: { type: 'standard', include: [] },
    });

    type ModuleWithVisibility = { setVisible: (visible: boolean) => void };
    const setupLazyToggle = (id: string, loadModule: () => Promise<ModuleWithVisibility>) => {
        let module: ModuleWithVisibility | null = null;
        document.querySelector(id)?.addEventListener('change', async (event) => {
            const checked = (event.target as HTMLInputElement).checked;
            if (!module) {
                module = await loadModule();
            }
            module.setVisible(checked);
        });
    };

    setupLazyToggle('#ui-toggleIncidents', () => TrafficIncidentsModule.get(map, { visible: true }));
    setupLazyToggle('#ui-toggleFlow', () => TrafficFlowModule.get(map, { visible: true }));
    setupLazyToggle('#ui-toggleHillshade', async () => {
        const terrain = await TerrainModule.get(map, { hillshade: true });
        return { setVisible: (visible) => terrain.setHillshadeVisible(visible) };
    });

    const stylesSelector = document.querySelector('#ui-mapStyles') as HTMLSelectElement;
    standardStyleIDs.forEach((id) => stylesSelector.add(new Option(id)));
    stylesSelector.addEventListener('change', (event) =>
        map.setStyle((event.target as HTMLOptionElement).value as StandardStyleID),
    );

    initTogglePanel();
})();
