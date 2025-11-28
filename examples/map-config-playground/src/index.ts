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

// TomTomConfig initialization
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES, language: 'en-GB' });

(async () => {
    // Main map and modules initialization
    const map = new TomTomMap({
        container: 'sdk-map',
        zoom: 14,
        minZoom: 2,
        center: [-0.12621, 51.50394],
    });

    // Traffic Incidents and Flow
    const incidents = await TrafficIncidentsModule.get(map);
    const flow = await TrafficFlowModule.get(map);
    document.querySelector('#sdk-example-toggleTraffic')?.addEventListener('click', () => {
        incidents.setVisible(!incidents.isVisible());
        flow.setVisible(!flow.isVisible());
    });
    document
        .querySelector('#sdk-example-toggleIncidents')
        ?.addEventListener('click', () => incidents.setVisible(!incidents.isVisible()));
    document
        .querySelector('#sdk-example-toggleIncidentIcons')
        ?.addEventListener('click', () => incidents.setIconsVisible(!incidents.anyIconLayersVisible()));
    document
        .querySelector('#sdk-example-toggleFlow')
        ?.addEventListener('click', () => flow.setVisible(!flow.isVisible()));

    // POIs
    const pois = await POIsModule.get(map);
    document
        .querySelector('#sdk-example-togglePOIs')
        ?.addEventListener('click', () => pois.setVisible(!pois.isVisible()));

    // Hillshade
    const hillshade = await HillshadeModule.get(map);
    document
        .querySelector('#sdk-example-toggleHillshade')
        ?.addEventListener('click', () => hillshade.setVisible(!hillshade.isVisible()));

    // Styles selector
    const stylesSelector = document.querySelector('#sdk-example-mapStyles') as HTMLSelectElement;
    standardStyleIDs.forEach((id) => stylesSelector.add(new Option(id)));
    stylesSelector.addEventListener('change', (event) =>
        map.setStyle((event.target as HTMLOptionElement).value as StandardStyleID),
    );
})();
