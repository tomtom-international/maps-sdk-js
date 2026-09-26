import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import {
    POIsModule,
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

// TomTomConfig initialization
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

(async () => {
    // Main map and modules initialization
    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            zoom: 14,
            minZoom: 2,
            center: [-0.12621, 51.50394],
        },
    });

    const setupToggle = (id: string, onToggle: (checked: boolean) => void) => {
        document.querySelector(id)?.addEventListener('change', (event) => {
            onToggle((event.target as HTMLInputElement).checked);
        });
    };

    const setChecked = (id: string, checked: boolean) => {
        const input = document.querySelector(id) as HTMLInputElement;
        if (input) input.checked = checked;
    };

    // Traffic Incidents and Flow
    const trafficIncidentsModule = await TrafficIncidentsModule.get(map);
    const trafficFlowModule = await TrafficFlowModule.get(map);

    // POIs - hidden by default to match toggle initial state
    const poisModule = await POIsModule.get(map);
    poisModule.setVisible(false);

    // Hillshade
    const terrainModule = await TerrainModule.get(map);

    setupToggle('#ui-toggleTraffic', (checked) => {
        trafficIncidentsModule.setVisible(checked);
        trafficIncidentsModule.setIconsVisible(checked);
        trafficFlowModule.setVisible(checked);
        poisModule.setVisible(checked);
        terrainModule.setHillshadeVisible(checked);
        setChecked('#ui-toggleIncidents', checked);
        setChecked('#ui-toggleIncidentIcons', checked);
        setChecked('#ui-toggleFlow', checked);
        setChecked('#ui-togglePOIs', checked);
        setChecked('#ui-toggleHillshade', checked);
    });
    setupToggle('#ui-toggleIncidents', (checked) => trafficIncidentsModule.setVisible(checked));
    setupToggle('#ui-toggleIncidentIcons', (checked) => trafficIncidentsModule.setIconsVisible(checked));
    setupToggle('#ui-toggleFlow', (checked) => trafficFlowModule.setVisible(checked));
    setupToggle('#ui-togglePOIs', (checked) => poisModule.setVisible(checked));
    setupToggle('#ui-toggleHillshade', (checked) => terrainModule.setHillshadeVisible(checked));

    // Styles selector
    const stylesSelector = document.querySelector('#ui-mapStyles') as HTMLSelectElement;
    standardStyleIDs.forEach((id) => stylesSelector.add(new Option(id)));
    stylesSelector.addEventListener('change', (event) =>
        map.setStyle((event.target as HTMLOptionElement).value as StandardStyleID),
    );

    initTogglePanel();
})();
