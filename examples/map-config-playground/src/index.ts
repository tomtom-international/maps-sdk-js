import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import {
    HillshadeModule,
    POIsModule,
    StandardStyleID,
    standardStyleIDs,
    TomTomMap,
    TrafficFlowModule,
    TrafficIncidentsModule,
} from '@tomtom-org/maps-sdk/map';
import './style.css';
import { API_KEY } from './config';

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
    const hillshadeModule = await HillshadeModule.get(map);

    setupToggle('#sdk-example-toggleTraffic', (checked) => {
        trafficIncidentsModule.setVisible(checked);
        trafficIncidentsModule.setIconsVisible(checked);
        trafficFlowModule.setVisible(checked);
        poisModule.setVisible(checked);
        hillshadeModule.setVisible(checked);
        setChecked('#sdk-example-toggleIncidents', checked);
        setChecked('#sdk-example-toggleIncidentIcons', checked);
        setChecked('#sdk-example-toggleFlow', checked);
        setChecked('#sdk-example-togglePOIs', checked);
        setChecked('#sdk-example-toggleHillshade', checked);
    });
    setupToggle('#sdk-example-toggleIncidents', (checked) => trafficIncidentsModule.setVisible(checked));
    setupToggle('#sdk-example-toggleIncidentIcons', (checked) => trafficIncidentsModule.setIconsVisible(checked));
    setupToggle('#sdk-example-toggleFlow', (checked) => trafficFlowModule.setVisible(checked));
    setupToggle('#sdk-example-togglePOIs', (checked) => poisModule.setVisible(checked));
    setupToggle('#sdk-example-toggleHillshade', (checked) => hillshadeModule.setVisible(checked));

    // Styles selector
    const stylesSelector = document.querySelector('#sdk-example-mapStyles') as HTMLSelectElement;
    standardStyleIDs.forEach((id) => stylesSelector.add(new Option(id)));
    stylesSelector.addEventListener('change', (event) =>
        map.setStyle((event.target as HTMLOptionElement).value as StandardStyleID),
    );
    
    const toggleButton = document.querySelector('.sdk-example-heading-toggle');
    const panelContent = document.querySelector('.sdk-example-panel-content');
    
    toggleButton?.addEventListener('click', () => {
        const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true';
        toggleButton.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
        panelContent?.classList.toggle('collapsed');
    });
})();
