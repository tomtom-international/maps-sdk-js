import { bboxFromGeoJSON, type OptionalBBox, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { GeometriesModule, PlacesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { createLatestRequest, discoverPlaces, geocodeOne, geometryData } from '@tomtom-org/maps-sdk/services';
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
    const placesModule = await PlacesModule.create(map);
    const geometryModule = await GeometriesModule.create(map, { fill: { style: 'inverted' } });

    let placeToSearchBBox: OptionalBBox;
    // A fresh search or Clear drops the previous chain of calls wherever it got to
    const latestSearch = createLatestRequest();

    const reCenter = () => placeToSearchBBox && map.mapLibreMap.fitBounds(placeToSearchBBox, fitBoundsOptions);

    const searchPlacesInGeometry = async (placesQuery: string, geometryQuery: string) => {
        if (!placesQuery || !geometryQuery) return;

        const search = await latestSearch.run(async (signal) => {
            const placeToSearchInside = await geocodeOne({ query: geometryQuery, signal });
            const geometryToSearch = await geometryData({ geometries: [placeToSearchInside], signal });
            const places = await discoverPlaces({
                query: placesQuery,
                geometries: [geometryToSearch],
                limit: 100,
                signal,
            });
            return { placeToSearchInside, geometryToSearch, places };
        });
        if (!search.current) return;

        const { placeToSearchInside, geometryToSearch, places } = search.value;
        placeToSearchBBox = bboxFromGeoJSON(placeToSearchInside);
        geometryModule.show(geometryToSearch);
        placesModule.show(places);
        reCenter();
    };

    const clear = () => {
        latestSearch.cancel();
        placeToSearchBBox = undefined;
        searchTextBox.value = '';
        inTextBox.value = '';
        placesModule.clear();
        geometryModule.clear();
    };

    const searchTextBox = document.querySelector('#ui-searchTextBox') as HTMLInputElement;
    const inTextBox = document.querySelector('#ui-inTextBox') as HTMLInputElement;
    const searchButton = document.querySelector('#ui-searchButton') as HTMLButtonElement;

    const listenToUserEvents = () => {
        searchButton.addEventListener('click', () =>
            searchPlacesInGeometry(searchTextBox.value.trim(), inTextBox.value.trim()),
        );
        searchTextBox.addEventListener('keypress', (event) => event.key === 'Enter' && searchButton.click());
        inTextBox.addEventListener('keypress', (event) => event.key === 'Enter' && searchButton.click());

        (document.querySelector('#ui-clearButton') as HTMLButtonElement).addEventListener('click', clear);

        document.querySelector('#ui-reCenter')?.addEventListener('click', reCenter);
    };

    listenToUserEvents();
})();
