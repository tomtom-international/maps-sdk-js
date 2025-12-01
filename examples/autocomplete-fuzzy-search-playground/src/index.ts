import { Places, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { BaseMapModule, PlacesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import {
    type AutocompleteSearchBrandSegment,
    type AutocompleteSearchCategorySegment,
    type AutocompleteSearchResponse,
    type AutocompleteSearchResult,
    autocompleteSearch,
    search,
} from '@tomtom-org/maps-sdk/services';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

(async () => {
    const searchBox = document.getElementById('sdk-example-search-box') as HTMLInputElement;
    const autoCompleteResultsList = document.getElementById('sdk-example-autocompleteResults') as HTMLUListElement;
    const fuzzySearchResultsList = document.getElementById('sdk-example-fuzzySearchResults') as HTMLUListElement;
    const searchThisAreaButton = document.getElementById('sdk-example-search-this-area') as HTMLInputElement;

    const map = new TomTomMap({ container: 'sdk-map', center: [4.8156, 52.4414], zoom: 8 });
    const placesModule = await PlacesModule.get(map);
    const baseMapModule = await BaseMapModule.get(map);

    fuzzySearchResultsList.addEventListener('mouseleave', () => {
        placesModule.cleanEventStates();
    });

    let selectedAutoCompleteSegment:
        | AutocompleteSearchBrandSegment
        | AutocompleteSearchCategorySegment
        | undefined
        | null;

    const clearFuzzySearchResults = () => {
        const searchResultsList = document.querySelector('#sdk-example-fuzzySearchResults') as HTMLUListElement;
        searchResultsList.innerHTML = '';
        placesModule.clear();
        searchThisAreaButton.innerHTML = '';
    };

    const showFuzzySearchResults = (places: Places) => {
        clearFuzzySearchResults();
        if (selectedAutoCompleteSegment || !autoCompleteResultsList.childElementCount) {
            placesModule.show(places);
        }
        for (const place of places.features) {
            const resultItem = document.createElement('li');
            resultItem.classList.add('sdk-example-result-item');
            resultItem.dataset.placeId = place.id;

            if (place.properties.poi?.name) {
                resultItem.innerHTML = `
                    <a class="sdk-example-a">                
                        <div class="sdk-example-result-value sdk-example-ellipsis">${place.properties.poi?.name}</div>
                        <div class="sdk-example-result-value sdk-example-ellipsis">${place.properties.address.freeformAddress}</div>
                    </a>`;
            } else {
                resultItem.innerHTML = `
                    <a class="sdk-example-a">
                        <div class="sdk-example-result-value sdk-example-ellipsis">${place.properties.address.freeformAddress}</div>
                    </a>`;
            }

            // Add hover event listeners for list item
            resultItem.addEventListener('mouseenter', () => {
                placesModule.putEventState({ id: place.id, state: 'hover', mode: 'put' });
            });

            fuzzySearchResultsList.appendChild(resultItem);
        }
        if (!places.features.length) {
            const noResults = document.createElement('li');
            noResults.classList.add('sdk-example-result-item');
            noResults.innerHTML = `<div class="sdk-example-result-value sdk-example-ellipsis">No results found</div>`;
            fuzzySearchResultsList.appendChild(noResults);
        }
    };

    const fuzzySearch = async () => {
        const searchParams = selectedAutoCompleteSegment
            ? {
                  query: '',
                  limit: 20,
                  boundingBox: map.getBBox(),
                  ...(selectedAutoCompleteSegment.type === 'category' && {
                      poiCategories: [Number(selectedAutoCompleteSegment.id)],
                  }),
                  ...(selectedAutoCompleteSegment.type === 'brand' && {
                      poiBrands: [selectedAutoCompleteSegment.value],
                  }),
              }
            : {
                  query: searchBox.value,
                  typeahead: true,
                  limit: 10,
                  position: map.mapLibreMap.getCenter().toArray(),
              };

        showFuzzySearchResults(await search(searchParams));
    };

    const createListElement = (result: AutocompleteSearchResult | null): HTMLElement => {
        const resultItem = document.createElement('li');
        resultItem.classList.add('sdk-example-result-item');
        if (!result) {
            resultItem.innerHTML = `<div class="sdk-example-result-value sdk-example-ellipsis">No results found</div>`;
            return resultItem;
        }
        const segment = result.segments[0] as AutocompleteSearchBrandSegment | AutocompleteSearchCategorySegment;

        resultItem.innerHTML = `
            <a class="sdk-example-a">
                <div class="sdk-example-result-value sdk-example-ellipsis">${segment.value}</div>
                <div class="sdk-example-result-type sdk-example-ellipsis">${segment.type}</div>
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
        const autocompleteResponse = await autocompleteSearch({ query: searchBox.value, limit: 2 });
        showAutocompleteResults(autocompleteResponse);
    };

    const showSearchThisAreaButton = () =>
        (searchThisAreaButton.innerHTML = `<button class="sdk-example-search-this-area-btn">Search This Area</button>`);

    map.mapLibreMap.on('moveend', () => {
        if (searchBox.value === selectedAutoCompleteSegment?.value) {
            showSearchThisAreaButton();
        }
    });

    searchThisAreaButton.addEventListener('click', fuzzySearch);

    const unhoverListItem = () => fuzzySearchResultsList.querySelector('.hovered')?.classList.remove('hovered');

    placesModule.events.on('hover', (place) => {
        unhoverListItem();

        const listItem = fuzzySearchResultsList.querySelector(`li[data-place-id="${place.id}"]`);
        listItem?.classList.add('hovered');
    });

    // Clean up list item hover when hovering outside pins
    baseMapModule.events.on('hover', () => {
        unhoverListItem();
        placesModule.cleanEventStates();
    });

    searchBox.addEventListener('keyup', async () => {
        selectedAutoCompleteSegment = null;
        if (searchBox.value !== '') {
            await Promise.all([await autoCompleteSearch(), await fuzzySearch()]);
        }
        searchBox.value.trim() === '' && clearSearchResults();
    });
})();
