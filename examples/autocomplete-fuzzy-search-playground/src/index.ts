import { Places, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { BaseMapModule, PlacesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import {
    type AutocompleteSearchBrandSegment,
    type AutocompleteSearchCategorySegment,
    type AutocompleteSearchResponse,
    type AutocompleteSearchResult,
    autocompleteSearch,
    SDKAbortError,
    search,
} from '@tomtom-org/maps-sdk/services';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

(async () => {
    const searchBox = document.getElementById('ui-searchBox') as HTMLInputElement;
    const autoCompleteResultsList = document.getElementById('ui-autocompleteResults') as HTMLUListElement;
    const fuzzySearchResultsList = document.getElementById('ui-fuzzySearchResults') as HTMLUListElement;
    const searchThisAreaButton = document.getElementById('ui-searchThisArea') as HTMLInputElement;

    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            center: [4.8156, 52.4414],
            zoom: 8,
        },
    });
    const placesModule = await PlacesModule.create(map);
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
        const searchResultsList = document.querySelector('#ui-fuzzySearchResults') as HTMLUListElement;
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
            resultItem.classList.add('ui-result-item');
            resultItem.dataset.placeId = place.id;

            if (place.properties.poi?.name) {
                resultItem.innerHTML = `
                    <div class="ui-result-value">${place.properties.poi?.name}</div>
                    <div class="ui-result-value">${place.properties.address.freeformAddress}</div>`;
            } else {
                resultItem.innerHTML = `
                    <div class="ui-result-value">${place.properties.address.freeformAddress}</div>`;
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
            noResults.classList.add('ui-result-item');
            noResults.innerHTML = `<div class="ui-result-value">No results found</div>`;
            fuzzySearchResultsList.appendChild(noResults);
        }
    };

    const fuzzySearch = async (query: string, signal: AbortSignal) => {
        const searchParams = selectedAutoCompleteSegment
            ? {
                  limit: 20,
                  boundingBox: map.getBBox(),
                  ...(selectedAutoCompleteSegment.type === 'category' && {
                      poiCategories: [selectedAutoCompleteSegment.category],
                  }),
                  ...(selectedAutoCompleteSegment.type === 'brand' && {
                      poiBrands: [selectedAutoCompleteSegment.value],
                  }),
              }
            : {
                  query,
                  typeahead: true,
                  limit: 10,
                  position: map.mapLibreMap.getCenter().toArray(),
              };

        showFuzzySearchResults(await search({ ...searchParams, signal }));
    };

    const createListElement = (result: AutocompleteSearchResult | null): HTMLElement => {
        const resultItem = document.createElement('li');
        resultItem.classList.add('ui-result-item');
        if (!result) {
            resultItem.innerHTML = `<div class="ui-result-value">No results found</div>`;
            return resultItem;
        }
        const segment = result.segments[0] as AutocompleteSearchBrandSegment | AutocompleteSearchCategorySegment;

        resultItem.innerHTML = `
            <div class="ui-result-value">${segment.value}</div>
            <div class="ui-result-type">${segment.type}</div>
        `;

        resultItem.addEventListener('click', async () => {
            selectedAutoCompleteSegment = segment;
            searchBox.value = segment.value;
            await runSearches(segment.value, { autocomplete: false });
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

    let controller: AbortController | undefined;

    const clearSearchResults = () => {
        // Cancel any search still in flight, or its response repopulates what we just cleared
        controller?.abort();
        controller = undefined;
        clearAutoCompleteResults();
        clearFuzzySearchResults();
        searchBox.value = '';
        selectedAutoCompleteSegment = null;
    };

    const autoCompleteSearch = async (query: string, signal: AbortSignal) => {
        const autocompleteResponse = await autocompleteSearch({ query, limit: 2, signal });
        showAutocompleteResults(autocompleteResponse);
    };

    /**
     * Runs a search, cancelling whatever the previous keystroke or click left in flight.
     * Both calls share one signal, so a superseded keystroke drops its whole pair rather
     * than letting a slow autocomplete response repopulate the list under a newer query.
     */
    const runSearches = async (query: string, options: { autocomplete: boolean }) => {
        controller?.abort();
        controller = new AbortController();
        const { signal } = controller;

        try {
            if (options.autocomplete) await autoCompleteSearch(query, signal);
            await fuzzySearch(query, signal);
        } catch (error) {
            // A superseded request is expected to abort — it is not a failure to report
            if (error instanceof SDKAbortError) return;
            throw error;
        }
    };

    const showSearchThisAreaButton = () =>
        (searchThisAreaButton.innerHTML = `<button class="ui-button">Search This Area</button>`);

    map.mapLibreMap.on('moveend', () => {
        if (searchBox.value === selectedAutoCompleteSegment?.value) {
            showSearchThisAreaButton();
        }
    });

    searchThisAreaButton.addEventListener('click', () => void runSearches(searchBox.value, { autocomplete: false }));

    const unhoverListItem = () => fuzzySearchResultsList.querySelector('.ui-hovered')?.classList.remove('ui-hovered');

    placesModule.events.on('hover', (place) => {
        unhoverListItem();

        const listItem = fuzzySearchResultsList.querySelector(`li[data-place-id="${place?.id}"]`);
        listItem?.classList.add('ui-hovered');
    });

    // Clean up list item hover when hovering outside pins
    baseMapModule.events.on('hover', () => {
        unhoverListItem();
        placesModule.cleanEventStates();
    });

    // Clear button resets everything
    (document.querySelector('#ui-clearButton') as HTMLButtonElement).addEventListener('click', clearSearchResults);

    searchBox.addEventListener('keyup', async () => {
        selectedAutoCompleteSegment = null;
        // Capture the query now — a late response must not be attributed to a newer input
        const query = searchBox.value.trim();
        if (query !== '') {
            await runSearches(query, { autocomplete: true });
        }
        searchBox.value.trim() === '' && clearSearchResults();
    });
})();
