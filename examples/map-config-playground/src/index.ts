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

// Main map and modules initialization
const map = new TomTomMap({
    container: 'maps-sdk-js-examples-map-container',
    zoom: 14,
    minZoom: 2,
    center: [-0.12621, 51.50394],
});

// Traffic Incidents and Flow
const incidents = await TrafficIncidentsModule.get(map);
const flow = await TrafficFlowModule.get(map);
document.querySelector('#maps-sdk-js-examples-toggleTraffic')?.addEventListener('click', () => {
    incidents.setVisible(!incidents.isVisible());
    flow.setVisible(!flow.isVisible());
});
document
    .querySelector('#maps-sdk-js-examples-toggleIncidents')
    ?.addEventListener('click', () => incidents.setVisible(!incidents.isVisible()));
document
    .querySelector('#maps-sdk-js-examples-toggleIncidentIcons')
    ?.addEventListener('click', () => incidents.setIconsVisible(!incidents.anyIconLayersVisible()));
document
    .querySelector('#maps-sdk-js-examples-toggleFlow')
    ?.addEventListener('click', () => flow.setVisible(!flow.isVisible()));

// POIs
const pois = await POIsModule.get(map);
document
    .querySelector('#maps-sdk-js-examples-togglePOIs')
    ?.addEventListener('click', () => pois.setVisible(!pois.isVisible()));

// Hillshade
const hillshade = await HillshadeModule.get(map);
document
    .querySelector('#maps-sdk-js-examples-toggleHillshade')
    ?.addEventListener('click', () => hillshade.setVisible(!hillshade.isVisible()));

// Styles selector
const stylesSelector = document.querySelector('#maps-sdk-js-examples-mapStyles') as HTMLSelectElement;
standardStyleIDs.forEach((id) => stylesSelector.add(new Option(id)));
stylesSelector.addEventListener('change', (event) =>
    map.setStyle((event.target as HTMLOptionElement).value as StandardStyleID),
);
