import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import {
    BaseMapLayerGroupName,
    BaseMapModule,
    POIsModule,
    StandardStyleID,
    standardStyleIDs,
    TomTomMap,
} from '@tomtom-org/maps-sdk/map';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

(async () => {
    const map = new TomTomMap({
        container: 'sdk-map',
        center: [-74.06332, 40.72732],
        zoom: 12,
    });

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
        const module = await BaseMapModule.get(map, { layerGroupsFilter: { mode: 'include', names: [layerGroup] } });
        document
            .querySelector(`#sdk-example-toggle-${layerGroup}`)
            ?.addEventListener('click', (ev) => module.setVisible((ev.target as HTMLInputElement).checked));
    }
    const poisModule = await POIsModule.get(map);
    document
        .querySelector('#sdk-example-togglePOIs')
        ?.addEventListener('click', (ev) => poisModule.setVisible((ev.target as HTMLInputElement).checked));

    const stylesSelector = document.querySelector('#sdk-example-mapStyles') as HTMLSelectElement;
    for (const id of standardStyleIDs) {
        stylesSelector.add(new Option(id));
    }
    stylesSelector.addEventListener('change', (event) =>
        map.setStyle((event.target as HTMLOptionElement).value as StandardStyleID),
    );
})();
