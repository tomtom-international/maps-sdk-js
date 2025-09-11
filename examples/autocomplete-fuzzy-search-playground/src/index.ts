import { Language, Places, TomTomConfig } from '@cet/maps-sdk-js/core';
import { PlacesModule, TomTomMap } from '@cet/maps-sdk-js/map';
import {
    AutocompleteSearchBrandSegment,
    AutocompleteSearchCategorySegment,
    AutocompleteSearchResponse,
    AutocompleteSearchResult,
    autocompleteSearch,
    search,
} from '@cet/maps-sdk-js/services';
import '../style.css';

TomTomConfig.instance.put({
    // (Set your own API key when working in your own environment)
    apiKey: process.env.API_KEY_EXAMPLES,
    language: 'en-GB',
});

const searchBox = document.querySelector('#search-box') as HTMLInputElement;
const searchThisAreaButton = document.getElementById('search-this-area') as HTMLInputElement;
const autoCompleteResultsList = document.querySelector('#autocompleteResults') as HTMLUListElement;
const fuzzySearchResultsList = document.querySelector('#fuzzySearchResults') as HTMLUListElement;

let map: TomTomMap;
let placesModule: PlacesModule;

let selectedAutoCompleteSegment: AutocompleteSearchBrandSegment | AutocompleteSearchCategorySegment | undefined | null;

const clearFuzzySearchResults = () => {
    const searchResultsList = document.querySelector('#fuzzySearchResults') as HTMLUListElement;
    searchResultsList.innerHTML = '';
    placesModule.clear();
    searchThisAreaButton.innerHTML = '';
};

const showFuzzySearchResults = (places: Places) => {
    clearFuzzySearchResults();
    for (const place of places.features) {
        const resultItem = document.createElement('li');
        resultItem.classList.add('result-item');
        if (place.properties.poi?.name) {
            resultItem.innerHTML = `
                <a>                
                    <div class="result-value ellipsis">${place.properties.poi?.name}
                    <div class="result-value ellipsis">${place.properties.address.freeformAddress}</div>
                </a>`;
        } else {
            resultItem.innerHTML = `
                <a>
                    <div class="result-value ellipsis">${place.properties.address.freeformAddress}</div>
                </a>`;
        }
        fuzzySearchResultsList.appendChild(resultItem);
    }
    if (places.features.length == 0) {
        const noResults = document.createElement('li');
        noResults.classList.add('result-item');
        noResults.innerHTML = `<div class="result-value ellipsis">No results found</div>`;
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
    resultItem.classList.add('result-item');
    if (!result) {
        resultItem.innerHTML = `<div class="result-value ellipsis">No results found</div>`;
        return resultItem;
    }
    const segment = result.segments[0] as AutocompleteSearchBrandSegment | AutocompleteSearchCategorySegment;

    resultItem.innerHTML = `
        <a>
            <div class="result-value ellipsis" id="result-value">${segment.value}</div>
            <div class="result-type ellipsis" id="result-type">${segment.type}</div>
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
    (searchThisAreaButton.innerHTML = `<button id="search-this-area" class="search-this-area-btn">Search This Area</button>`);

(async () => {
    map = new TomTomMap({ container: 'map', center: [4.8156, 52.4414], zoom: 8 });
    placesModule = await PlacesModule.init(map);
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

    (window as any).map = map; // This has been done for automation test support
})();
