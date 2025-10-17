import { Places, TomTomConfig } from '@cet/maps-sdk-js/core';
import { PlacesModule, TomTomMap } from '@cet/maps-sdk-js/map';
import { search } from '@cet/maps-sdk-js/services';
import { LngLatBoundsLike } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

const map = new TomTomMap(
    { container: 'maps-sdk-js-examples-map-container', center: [4.8156, 52.4414], zoom: 8 },
    { language: 'en-GB' },
);

const placesModule = await PlacesModule.init(map);

const showSearchResultsList = (places: Places) => {
    const searchResultsList = document.querySelector('#maps-sdk-js-examples-searchResults') as HTMLUListElement;
    searchResultsList.innerHTML = '';
    for (const place of places.features) {
        const li = document.createElement('li');
        li.innerHTML = place.properties.poi?.name
            ? `${place.properties.poi?.name} <br/> ${place.properties.address.freeformAddress}`
            : place.properties.address.freeformAddress;
        searchResultsList.appendChild(li);
    }
};

const searchAndDisplayResults = async (query: string, searchLocationModeSelector: string) => {
    let searchParams;
    if (searchLocationModeSelector == 'center') {
        searchParams = { query, limit: 35, position: map.mapLibreMap.getCenter().toArray() };
    } else {
        searchParams = { query, limit: 35, boundingBox: map.getBBox() };
    }
    const searchPlaces = await search(searchParams);
    if (searchLocationModeSelector == 'center') {
        map.mapLibreMap.fitBounds(searchPlaces.bbox as LngLatBoundsLike);
    }
    placesModule.show(searchPlaces);
    showSearchResultsList(searchPlaces);
};

const listenToUserEvents = () => {
    const searchLocationModeSelector = <HTMLInputElement>(
        document.querySelector('#maps-sdk-js-examples-searchLocationModeSelector')
    );
    const searchBox = document.querySelector('#maps-sdk-js-examples-searchBox') as HTMLInputElement;
    const searchButton = document.querySelector('#maps-sdk-js-examples-searchButton') as HTMLButtonElement;
    searchButton.addEventListener('click', () =>
        searchAndDisplayResults(searchBox.value, searchLocationModeSelector.value),
    );
    searchBox.addEventListener('keypress', (event) => event.key === 'Enter' && searchButton.click());
    searchLocationModeSelector?.addEventListener('change', () =>
        searchAndDisplayResults(searchBox.value, searchLocationModeSelector.value),
    );
};

listenToUserEvents();
(window as any).map = map; // This has been done for automation test support
