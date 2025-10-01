import { TomTomConfig } from '@cet/maps-sdk-js/core';
import {
    BaseMapLayerGroupName,
    BaseMapModule,
    POIsModule,
    PublishedStyleID,
    publishedStyleIDs,
    TomTomMap,
} from '@cet/maps-sdk-js/map';
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES, language: 'en-GB' });

let map: TomTomMap;

const initBaseMapModule = async (layerGroups: BaseMapLayerGroupName[], selector: string) => {
    const module = await BaseMapModule.get(map, { layerGroupsFilter: { mode: 'include', names: layerGroups } });
    document
        .querySelector(selector)
        ?.addEventListener('click', (ev) => module.setVisible((ev.target as HTMLInputElement).checked));
};

map = new TomTomMap({ container: 'maps-sdk-js-examples-map-container', center: [-74.06332, 40.72732], zoom: 12 });

await initBaseMapModule(['water'], '#maps-sdk-js-examples-toggleWater');
await initBaseMapModule(['land'], '#maps-sdk-js-examples-toggleLand');
await initBaseMapModule(['borders'], '#maps-sdk-js-examples-toggleBorders');
await initBaseMapModule(['buildings2D'], '#maps-sdk-js-examples-toggleBuildings2D');
await initBaseMapModule(['buildings3D'], '#maps-sdk-js-examples-toggleBuildings3D');
await initBaseMapModule(['houseNumbers'], '#maps-sdk-js-examples-toggleHouseNumbers');
await initBaseMapModule(['roadLines'], '#maps-sdk-js-examples-toggleRoadLines');
await initBaseMapModule(['roadLabels'], '#maps-sdk-js-examples-toggleRoadLabels');
await initBaseMapModule(['roadShields'], '#maps-sdk-js-examples-toggleRoadShields');
await initBaseMapModule(['placeLabels'], '#maps-sdk-js-examples-togglePlaces');
await initBaseMapModule(['smallerTownLabels'], '#maps-sdk-js-examples-toggleSmallerTowns');
await initBaseMapModule(['cityLabels'], '#maps-sdk-js-examples-toggleCities');
await initBaseMapModule(['capitalLabels'], '#maps-sdk-js-examples-toggleCapitals');
await initBaseMapModule(['stateLabels'], '#maps-sdk-js-examples-toggleStates');
await initBaseMapModule(['countryLabels'], '#maps-sdk-js-examples-toggleCountries');
const pois = await POIsModule.get(map);
document
    .querySelector('#maps-sdk-js-examples-togglePOIs')
    ?.addEventListener('click', (ev) => pois.setVisible((ev.target as HTMLInputElement).checked));

// style selector:
const stylesSelector = document.querySelector('#maps-sdk-js-examples-mapStyles') as HTMLSelectElement;
publishedStyleIDs.forEach((id) => stylesSelector.add(new Option(id)));
stylesSelector.addEventListener('change', (event) =>
    map.setStyle((event.target as HTMLOptionElement).value as PublishedStyleID),
);

(window as any).map = map; // This has been done for automation test support
