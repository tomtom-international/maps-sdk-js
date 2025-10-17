import type { Places } from '@cet/maps-sdk-js/core';
import { TomTomConfig } from '@cet/maps-sdk-js/core';
import {
    GeometriesModule,
    type GeometryBeforeLayerConfig,
    type StandardStyleID,
    standardStyleIDs,
    TomTomMap,
} from '@cet/maps-sdk-js/map';
import { geocode, geometryData } from '@cet/maps-sdk-js/services';
import type { LngLatBoundsLike } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Config } from './placeConfiguration';
import { namedConfigs } from './placeConfiguration';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES, language: 'en-GB' });

const fitBoundsOptions = { padding: 50 };

const map = new TomTomMap({ container: 'maps-sdk-js-examples-map-container', fitBoundsOptions });
const geometry = await GeometriesModule.init(map);
let placeSubdivisions: Places;

const updateMap = async (config: Config) => {
    placeSubdivisions = await geocode({ limit: 100, query: '', ...config.searchConfig });
    map.mapLibreMap.fitBounds(placeSubdivisions.bbox as LngLatBoundsLike, fitBoundsOptions);
    const geometries = await geometryData({ geometries: placeSubdivisions, zoom: 14 });
    geometry.applyConfig(config.geometryConfig);
    geometry.show(geometries);
};

const listenToUIEvents = async () => {
    const placeSelector = document.getElementById('maps-sdk-js-examples-place-selector') as HTMLSelectElement;
    placeSelector.addEventListener('change', (event) =>
        updateMap(namedConfigs[(event.target as HTMLInputElement).value]),
    );

    const options = document.querySelectorAll<HTMLInputElement>('input[type=radio][name=layerOption]');
    options.forEach((option) => {
        option.addEventListener('change', () => geometry.moveBeforeLayer(option.value as GeometryBeforeLayerConfig));
    });

    const stylesSelector = document.querySelector('#maps-sdk-js-examples-mapStyles') as HTMLSelectElement;
    standardStyleIDs.forEach((id) => stylesSelector.add(new Option(id)));
    stylesSelector.addEventListener('change', (event) =>
        map.setStyle((event.target as HTMLOptionElement).value as StandardStyleID),
    );

    document
        .querySelector('#maps-sdk-js-examples-reCenter')
        ?.addEventListener(
            'click',
            () =>
                placeSubdivisions &&
                map.mapLibreMap.fitBounds(placeSubdivisions.bbox as LngLatBoundsLike, fitBoundsOptions),
        );
};

await updateMap(namedConfigs.france);
await listenToUIEvents();
(window as any).map = map; // This has been done for automation test support
