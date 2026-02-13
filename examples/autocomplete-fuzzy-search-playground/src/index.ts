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
    const searchBox = document.getElementById('sdk-example-searchBox') as HTMLInputElement;
    const autoCompleteResultsList = document.getElementById('sdk-example-autocompleteResults') as HTMLUListElement;
    const fuzzySearchResultsList = document.getElementById('sdk-example-fuzzySearchResults') as HTMLUListElement;
    const searchThisAreaButton = document.getElementById('sdk-example-searchThisArea') as HTMLInputElement;

    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            center: [4.8156, 52.4414],
            zoom: 8,
        },
    });
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
                    <div class="sdk-example-result-value">${place.properties.poi?.name}</div>
                    <div class="sdk-example-result-value">${place.properties.address.freeformAddress}</div>`;
            } else {
                resultItem.innerHTML = `
                    <div class="sdk-example-result-value">${place.properties.address.freeformAddress}</div>`;
            }

            resultItem.addEventListener('mouseenter', () => {
                placesModule.putEventState({ id: place.id, state: 'hover', mode: 'put' });
            });

            resultItem.addEventListener('click', () => {
                placesModule.putEventState({ id: place.id, state: 'click', mode: 'put' });
                map.mapLibreMap.flyTo({
                    center: place.geometry.coordinates as [number, number],
                    zoom: 15,
                });
            });

            fuzzySearchResultsList.appendChild(resultItem);
        }
        if (!places.features.length) {
            const noResults = document.createElement('li');
            noResults.classList.add('sdk-example-result-item');
            noResults.innerHTML = `<div class="sdk-example-result-value">No results found</div>`;
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
            resultItem.innerHTML = `<div class="sdk-example-result-value">No results found</div>`;
            return resultItem;
        }
        const segment = result.segments[0] as AutocompleteSearchBrandSegment | AutocompleteSearchCategorySegment;

        resultItem.innerHTML = `
            <div class="sdk-example-result-value">${segment.value}</div>
            <div class="sdk-example-result-type">${segment.type}</div>
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
        searchBox.value = '';
        selectedAutoCompleteSegment = null;
    };

    const autoCompleteSearch = async () => {
        const autocompleteResponse = await autocompleteSearch({ query: searchBox.value, limit: 2 });
        showAutocompleteResults(autocompleteResponse);
    };

    const showSearchThisAreaButton = () =>
        (searchThisAreaButton.innerHTML = `<button class="sdk-example-button">Search This Area</button>`);

    map.mapLibreMap.on('moveend', () => {
        if (searchBox.value === selectedAutoCompleteSegment?.value) {
            showSearchThisAreaButton();
        }
    });

    searchThisAreaButton.addEventListener('click', fuzzySearch);

    const unhoverListItem = () => fuzzySearchResultsList.querySelector('.sdk-example-hovered')?.classList.remove('sdk-example-hovered');

    placesModule.events.on('hover', (place) => {
        unhoverListItem();

        const listItem = fuzzySearchResultsList.querySelector(`li[data-place-id="${place.id}"]`);
        listItem?.classList.add('sdk-example-hovered');
    });

    // Clean up list item hover when hovering outside pins
    baseMapModule.events.on('hover', () => {
        unhoverListItem();
        placesModule.cleanEventStates();
    });

    // Clear button resets everything
    (document.querySelector('#sdk-example-clearButton') as HTMLButtonElement).addEventListener('click', clearSearchResults);

    searchBox.addEventListener('keyup', async () => {
        selectedAutoCompleteSegment = null;
        if (searchBox.value !== '') {
            await Promise.all([await autoCompleteSearch(), await fuzzySearch()]);
        }
        searchBox.value.trim() === '' && clearSearchResults();
    });
})();
