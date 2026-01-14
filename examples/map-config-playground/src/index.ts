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

    // Traffic Incidents and Flow
    const trafficIncidentsModule = await TrafficIncidentsModule.get(map);
    const trafficFlowModule = await TrafficFlowModule.get(map);
    document.querySelector('#sdk-example-toggleTraffic')?.addEventListener('click', () => {
        trafficIncidentsModule.setVisible(!trafficIncidentsModule.isVisible());
        trafficFlowModule.setVisible(!trafficFlowModule.isVisible());
    });
    document
        .querySelector('#sdk-example-toggleIncidents')
        ?.addEventListener('click', () => trafficIncidentsModule.setVisible(!trafficIncidentsModule.isVisible()));
    document
        .querySelector('#sdk-example-toggleIncidentIcons')
        ?.addEventListener('click', () =>
            trafficIncidentsModule.setIconsVisible(!trafficIncidentsModule.anyIconLayersVisible()),
        );
    document
        .querySelector('#sdk-example-toggleFlow')
        ?.addEventListener('click', () => trafficFlowModule.setVisible(!trafficFlowModule.isVisible()));

    // POIs
    const poisModule = await POIsModule.get(map);
    document
        .querySelector('#sdk-example-togglePOIs')
        ?.addEventListener('click', () => poisModule.setVisible(!poisModule.isVisible()));

    // Hillshade
    const hillshadeModule = await HillshadeModule.get(map);
    document
        .querySelector('#sdk-example-toggleHillshade')
        ?.addEventListener('click', () => hillshadeModule.setVisible(!hillshadeModule.isVisible()));

    // Styles selector
    const stylesSelector = document.querySelector('#sdk-example-mapStyles') as HTMLSelectElement;
    standardStyleIDs.forEach((id) => stylesSelector.add(new Option(id)));
    stylesSelector.addEventListener('change', (event) =>
        map.setStyle((event.target as HTMLOptionElement).value as StandardStyleID),
    );
})();
