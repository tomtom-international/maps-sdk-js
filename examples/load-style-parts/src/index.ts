import './style.css';
import { TomTomConfig } from '@cet/maps-sdk-js/core';
import {
    HillshadeModule,
    StandardStyleID,
    standardStyleIDs,
    TomTomMap,
    TrafficFlowModule,
    TrafficIncidentsModule,
} from '@cet/maps-sdk-js/map';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES, language: 'en-US' });

const map = new TomTomMap({
    container: 'maps-sdk-js-examples-map-container',
    zoom: 13,
    minZoom: 2,
    center: [2.1493, 41.4001],
});

document
    .querySelector('#maps-sdk-js-examples-addIncidents')
    ?.addEventListener('click', () => TrafficIncidentsModule.get(map, { ensureAddedToStyle: true }));
document
    .querySelector('#maps-sdk-js-examples-addFlow')
    ?.addEventListener('click', () => TrafficFlowModule.get(map, { ensureAddedToStyle: true }));
document
    .querySelector('#maps-sdk-js-examples-addHillshade')
    ?.addEventListener('click', () => HillshadeModule.get(map, { ensureAddedToStyle: true }));

const stylesSelector = document.querySelector('#maps-sdk-js-examples-mapStyles') as HTMLSelectElement;
standardStyleIDs.forEach((id) => stylesSelector.add(new Option(id)));
stylesSelector.addEventListener('change', (event) =>
    map.setStyle((event.target as HTMLOptionElement).value as StandardStyleID),
);

(window as any).map = map; // This has been done for automation test support
