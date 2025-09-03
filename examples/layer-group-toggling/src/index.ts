import { TomTomConfig } from '@cet/maps-sdk-js/core';
import {
    BaseMapLayerGroupName,
    BaseMapModule,
    POIsModule,
    PublishedStyleID,
    publishedStyleIDs,
    TomTomMap,
} from '@cet/maps-sdk-js/map';
import '../style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES, language: 'en-GB' });

let map: TomTomMap;

const initBaseMapModule = async (layerGroups: BaseMapLayerGroupName[], selector: string) => {
    const module = await BaseMapModule.get(map, { layerGroupsFilter: { mode: 'include', names: layerGroups } });
    document
        .querySelector(selector)
        ?.addEventListener('click', (ev) => module.setVisible((ev.target as HTMLInputElement).checked));
};

const baseMapLayerGroups = async () => {
    map = new TomTomMap({ container: 'map', center: [-74.06332, 40.72732], zoom: 12 });

    await initBaseMapModule(['water'], '#toggleWater');
    await initBaseMapModule(['land'], '#toggleLand');
    await initBaseMapModule(['borders'], '#toggleBorders');
    await initBaseMapModule(['buildings2D'], '#toggleBuildings2D');
    await initBaseMapModule(['buildings3D'], '#toggleBuildings3D');
    await initBaseMapModule(['houseNumbers'], '#toggleHouseNumbers');
    await initBaseMapModule(['roadLines'], '#toggleRoadLines');
    await initBaseMapModule(['roadLabels'], '#toggleRoadLabels');
    await initBaseMapModule(['roadShields'], '#toggleRoadShields');
    await initBaseMapModule(['placeLabels'], '#togglePlaces');
    await initBaseMapModule(['smallerTownLabels'], '#toggleSmallerTowns');
    await initBaseMapModule(['cityLabels'], '#toggleCities');
    await initBaseMapModule(['capitalLabels'], '#toggleCapitals');
    await initBaseMapModule(['stateLabels'], '#toggleStates');
    await initBaseMapModule(['countryLabels'], '#toggleCountries');
    const pois = await POIsModule.get(map);
    document
        .querySelector('#togglePOIs')
        ?.addEventListener('click', (ev) => pois.setVisible((ev.target as HTMLInputElement).checked));

    // style selector:
    const stylesSelector = document.querySelector('#mapStyles') as HTMLSelectElement;
    publishedStyleIDs.forEach((id) => stylesSelector.add(new Option(id)));
    stylesSelector.addEventListener('change', (event) =>
        map.setStyle((event.target as HTMLOptionElement).value as PublishedStyleID),
    );

    (window as any).map = map; // This has been done for automation test support
};

window.addEventListener('load', baseMapLayerGroups);
