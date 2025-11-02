import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import {
    BaseMapLayerGroupName,
    BaseMapModule,
    POIsModule,
    StandardStyleID,
    standardStyleIDs,
    TomTomMap,
} from '@tomtom-org/maps-sdk/map';
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES, language: 'en-GB' });

const map = new TomTomMap({ container: 'maps-sdk-js-examples-map-container', center: [-74.06332, 40.72732], zoom: 12 });

const layerGroups: BaseMapLayerGroupName[] = [
    'water',
    'land',
    'borders',
    'buildings2D',
    'buildings3D',
    'houseNumbers',
    'roadLines',
    'roadLabels',
    'roadShields',
    'placeLabels',
    'smallerTownLabels',
    'cityLabels',
    'capitalLabels',
    'stateLabels',
    'countryLabels',
];

for (const layerGroup of layerGroups) {
    const module = await BaseMapModule.get(map, { layerGroupsFilter: { mode: 'include', names: layerGroups } });
    document
        .querySelector(`#maps-sdk-js-examples-toggle-${layerGroup}`)
        ?.addEventListener('click', (ev) => module.setVisible((ev.target as HTMLInputElement).checked));
}
const pois = await POIsModule.get(map);
document
    .querySelector('#maps-sdk-js-examples-togglePOIs')
    ?.addEventListener('click', (ev) => pois.setVisible((ev.target as HTMLInputElement).checked));

const stylesSelector = document.querySelector('#maps-sdk-js-examples-mapStyles') as HTMLSelectElement;
for (const id of standardStyleIDs) {
    stylesSelector.add(new Option(id));
}
stylesSelector.addEventListener('change', (event) =>
    map.setStyle((event.target as HTMLOptionElement).value as StandardStyleID),
);
