import { bboxFromGeoJSON, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { GeometriesModule, PlacesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { geocodeOne, geometryData, search } from '@tomtom-org/maps-sdk/services';
import type { LngLatBoundsLike } from 'maplibre-gl';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY });

(async () => {
    const fitBoundsOptions = { padding: 50 };

    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            zoom: 2,
        },
        language: 'en-GB',
    });
    const placesModule = await PlacesModule.get(map);
    const geometryModule = await GeometriesModule.get(map, { theme: 'inverted' });

    let placeToSearchBBox: LngLatBoundsLike;

    const searchPlacesInGeometry = async (placesQuery: string, geometryQuery: string) => {
        const placeToSearchInside = await geocodeOne(geometryQuery);
        // (bounding box is also available directly in placeToSearchInside.bbox)
        placeToSearchBBox = bboxFromGeoJSON(placeToSearchInside) as LngLatBoundsLike;

        const geometryToSearch = await geometryData({ geometries: [placeToSearchInside] });
        geometryModule.show(geometryToSearch);

        // Searching within the obtained geometry:
        const places = await search({
            query: placesQuery,
            geometries: [geometryToSearch],
            limit: 100,
        });
        placesModule.show(places);
        map.mapLibreMap.fitBounds(placeToSearchBBox, fitBoundsOptions);
    };

    const clear = () => {
        searchTextBox.value = '';
        inTextBox.value = '';
        placesModule.clear();
        geometryModule.clear();
    };

    const searchTextBox = document.querySelector('#sdk-example-searchTextBox') as HTMLInputElement;
    const inTextBox = document.querySelector('#sdk-example-inTextBox') as HTMLInputElement;
    const searchButton = document.querySelector('#sdk-example-searchButton') as HTMLButtonElement;

    const listenToUserEvents = () => {
        searchButton.addEventListener('click', () => searchPlacesInGeometry(searchTextBox.value, inTextBox.value));
        searchTextBox.addEventListener('keypress', (event) => event.key === 'Enter' && searchButton.click());
        inTextBox.addEventListener('keypress', (event) => event.key === 'Enter' && searchButton.click());

        (document.querySelector('#sdk-example-clearButton') as HTMLButtonElement).addEventListener('click', clear);

        document
            .querySelector('#sdk-example-reCenter')
            ?.addEventListener('click', () => map.mapLibreMap.fitBounds(placeToSearchBBox, fitBoundsOptions));
    };

    listenToUserEvents();
})();
