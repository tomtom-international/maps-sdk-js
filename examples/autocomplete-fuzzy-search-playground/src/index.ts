import { Places, TomTomConfig } from '@cet/maps-sdk-js/core';
import { PlacesModule, TomTomMap } from '@cet/maps-sdk-js/map';
import {
    AutocompleteSearchBrandSegment,
    AutocompleteSearchCategorySegment,
    AutocompleteSearchResponse,
    AutocompleteSearchResult,
    autocompleteSearch,
    search,
} from '@cet/maps-sdk-js/services';
import './style.css';
import 'maplibre-gl/dist/maplibre-gl.css';

TomTomConfig.instance.put({
    // (Set your own API key when working in your own environment)
    apiKey: process.env.API_KEY_EXAMPLES,
    language: 'en-GB',
});

const searchBox = document.getElementById('maps-sdk-js-examples-search-box') as HTMLInputElement;
const autoCompleteResultsList = document.getElementById('maps-sdk-js-examples-autocompleteResults') as HTMLUListElement;
const fuzzySearchResultsList = document.getElementById('maps-sdk-js-examples-fuzzySearchResults') as HTMLUListElement;
const searchThisAreaButton = document.getElementById('maps-sdk-js-examples-search-this-area') as HTMLInputElement;

const map = new TomTomMap({ container: 'maps-sdk-js-examples-map-container', center: [4.8156, 52.4414], zoom: 8 });
const placesModule = await PlacesModule.init(map);

let selectedAutoCompleteSegment: AutocompleteSearchBrandSegment | AutocompleteSearchCategorySegment | undefined | null;

const clearFuzzySearchResults = () => {
    const searchResultsList = document.querySelector('#maps-sdk-js-examples-fuzzySearchResults') as HTMLUListElement;
    searchResultsList.innerHTML = '';
    placesModule.clear();
    searchThisAreaButton.innerHTML = '';
};

const showFuzzySearchResults = (places: Places) => {
    clearFuzzySearchResults();
    for (const place of places.features) {
        const resultItem = document.createElement('li');
        resultItem.classList.add('maps-sdk-js-examples-result-item');
        if (place.properties.poi?.name) {
            resultItem.innerHTML = `
                <a class="maps-sdk-js-examples-a">                
                    <div class="maps-sdk-js-examples-result-value maps-sdk-js-examples-ellipsis">${place.properties.poi?.name}</div>
                    <div class="maps-sdk-js-examples-result-value maps-sdk-js-examples-ellipsis">${place.properties.address.freeformAddress}</div>
                </a>`;
        } else {
            resultItem.innerHTML = `
                <a class="maps-sdk-js-examples-a">
                    <div class="maps-sdk-js-examples-result-value maps-sdk-js-examples-ellipsis">${place.properties.address.freeformAddress}</div>
                </a>`;
        }
        fuzzySearchResultsList.appendChild(resultItem);
    }
    if (places.features.length == 0) {
        const noResults = document.createElement('li');
        noResults.classList.add('maps-sdk-js-examples-result-item');
        noResults.innerHTML = `<div class="maps-sdk-js-examples-result-value maps-sdk-js-examples-ellipsis">No results found</div>`;
        fuzzySearchResultsList.appendChild(noResults);
    }
};

const fuzzySearch = async () => {
    let searchParams;
    if (selectedAutoCompleteSegment) {
        searchParams = {
            query: '',
            limit: 24,
            boundingBox: map.getBBox(),
            ...(selectedAutoCompleteSegment.type == 'category' && {
                poiCategories: [Number(selectedAutoCompleteSegment.id)],
            }),
            ...(selectedAutoCompleteSegment.type == 'brand' && {
                poiBrands: [selectedAutoCompleteSegment.value],
            }),
        };
    } else {
        searchParams = {
            query: searchBox.value,
            limit: 10,
            position: map.mapLibreMap.getCenter().toArray(),
        };
    }

    const fuzzySearchResponse = await search(searchParams);
    showFuzzySearchResults(fuzzySearchResponse);
    if (selectedAutoCompleteSegment) {
        placesModule.show(fuzzySearchResponse);
    }
};

const createListElement = (result: AutocompleteSearchResult | null): HTMLElement => {
    const resultItem = document.createElement('li');
    resultItem.classList.add('maps-sdk-js-examples-result-item');
    if (!result) {
        resultItem.innerHTML = `<div class="maps-sdk-js-examples-result-value maps-sdk-js-examples-ellipsis">No results found</div>`;
        return resultItem;
    }
    const segment = result.segments[0] as AutocompleteSearchBrandSegment | AutocompleteSearchCategorySegment;

    resultItem.innerHTML = `
        <a class="maps-sdk-js-examples-a">
            <div class="maps-sdk-js-examples-result-value maps-sdk-js-examples-ellipsis">${segment.value}</div>
            <div class="maps-sdk-js-examples-result-type maps-sdk-js-examples-ellipsis">${segment.type}</div>
        </a>
    `;

    resultItem.addEventListener('click', async () => {
        selectedAutoCompleteSegment = segment;
        searchBox.value = segment.value;
        await fuzzySearch();
    });
    return resultItem;
};

const clearAutoCompleteResults = () => (autoCompleteResultsList.innerHTML = '');

const showAutocompleteResults = (response: AutocompleteSearchResponse) => {
    clearAutoCompleteResults();
    const brandsCategoryResults = response.results.filter((result) => result.segments[0].type !== 'plaintext');
    if (brandsCategoryResults.length) {
        brandsCategoryResults.forEach((result) => {
            autoCompleteResultsList.appendChild(createListElement(result));
        });
    } else {
        // No results found:
        autoCompleteResultsList.appendChild(createListElement(null));
    }
};

const clearSearchResults = () => {
    clearAutoCompleteResults();
    clearFuzzySearchResults();
};

const autoCompleteSearch = async () => {
    const autocompleteResponse = await autocompleteSearch({
        query: searchBox.value,
        limit: 2,
    });
    showAutocompleteResults(autocompleteResponse);
};

const showSearchThisAreaButton = () =>
    (searchThisAreaButton.innerHTML = `<button class="maps-sdk-js-examples-search-this-area-btn">Search This Area</button>`);

map.mapLibreMap.on('moveend', () => {
    if (searchBox.value == selectedAutoCompleteSegment?.value) {
        showSearchThisAreaButton();
    }
});

searchThisAreaButton.addEventListener('click', fuzzySearch);

searchBox.addEventListener('keyup', async () => {
    selectedAutoCompleteSegment = null;
    if (searchBox.value !== '') {
        await Promise.all([await autoCompleteSearch(), await fuzzySearch()]);
    }
    searchBox.value.trim() === '' && clearSearchResults();
});
