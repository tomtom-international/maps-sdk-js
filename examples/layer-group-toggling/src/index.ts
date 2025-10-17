import { TomTomConfig } from '@cet/maps-sdk-js/core';
import {
    BaseMapLayerGroupName,
    BaseMapModule,
    POIsModule,
    StandardStyleID,
    standardStyleIDs,
    TomTomMap,
} from '@cet/maps-sdk-js/map';
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES, language: 'en-GB' });

const initBaseMapModule = async (layerGroups: BaseMapLayerGroupName[], selector: string) => {
    const module = await BaseMapModule.get(map, { layerGroupsFilter: { mode: 'include', names: layerGroups } });
    document
        .querySelector(selector)
        ?.addEventListener('click', (ev) => module.setVisible((ev.target as HTMLInputElement).checked));
};

const map = new TomTomMap({ container: 'maps-sdk-js-examples-map-container', center: [-74.06332, 40.72732], zoom: 12 });

const modules: BaseMapLayerGroupName[] = [
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
for (const module of modules) {
    await initBaseMapModule([module], `#maps-sdk-js-examples-toggle-${module}`);
}
const pois = await POIsModule.get(map);
document
    .querySelector('#maps-sdk-js-examples-togglePOIs')
    ?.addEventListener('click', (ev) => pois.setVisible((ev.target as HTMLInputElement).checked));

// style selector:
const stylesSelector = document.querySelector('#maps-sdk-js-examples-mapStyles') as HTMLSelectElement;
standardStyleIDs.forEach((id) => stylesSelector.add(new Option(id)));
stylesSelector.addEventListener('change', (event) =>
    map.setStyle((event.target as HTMLOptionElement).value as StandardStyleID),
);
