import '../styles.css';
import type { Places } from '@cet/maps-sdk-js/core';
import { TomTomConfig } from '@cet/maps-sdk-js/core';
import {
    GeometriesModule,
    type GeometryBeforeLayerConfig,
    type PublishedStyleID,
    publishedStyleIDs,
    TomTomMap,
} from '@cet/maps-sdk-js/map';
import { geocode, geometryData } from '@cet/maps-sdk-js/services';
import type { LngLatBoundsLike } from 'maplibre-gl';
import type { Config } from './placeConfiguration';
import { namedConfigs } from './placeConfiguration';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY, language: 'en-GB' });

const fitBoundsOptions = { padding: 50 };

let map: TomTomMap;
let geometry: GeometriesModule;
let placeSubdivisions: Places;

const updateMap = async (config: Config) => {
    placeSubdivisions = await geocode({ limit: 100, query: '', ...config.searchConfig });
    map.mapLibreMap.fitBounds(placeSubdivisions.bbox as LngLatBoundsLike, fitBoundsOptions);
    const geometries = await geometryData({ geometries: placeSubdivisions, zoom: 14 });
    geometry.applyConfig(config.geometryConfig);
    geometry.show(geometries);
};

const listenToUIEvents = async () => {
    const placeSelector = document.getElementById('place-selector') as HTMLSelectElement;
    placeSelector.addEventListener('change', (event) =>
        updateMap(namedConfigs[(event.target as HTMLInputElement).value]),
    );

    const options = document.querySelectorAll<HTMLInputElement>('input[type=radio][name=layerOption]');
    options.forEach((option) => {
        option.addEventListener('change', () => geometry.moveBeforeLayer(option.value as GeometryBeforeLayerConfig));
    });

    const stylesSelector = document.querySelector('#mapStyles') as HTMLSelectElement;
    publishedStyleIDs.forEach((id) => stylesSelector.add(new Option(id)));
    stylesSelector.addEventListener('change', (event) =>
        map.setStyle((event.target as HTMLOptionElement).value as PublishedStyleID),
    );

    document
        .querySelector('#reCenter')
        ?.addEventListener(
            'click',
            () =>
                placeSubdivisions &&
                map.mapLibreMap.fitBounds(placeSubdivisions.bbox as LngLatBoundsLike, fitBoundsOptions),
        );
};

const mapPlacesInGeometryInit = async () => {
    map = new TomTomMap({ container: 'map', fitBoundsOptions });
    geometry = await GeometriesModule.init(map);
    await updateMap(namedConfigs.france);
    await listenToUIEvents();
    (window as any).map = map; // This has been done for automation test support
};

window.addEventListener('load', mapPlacesInGeometryInit);
