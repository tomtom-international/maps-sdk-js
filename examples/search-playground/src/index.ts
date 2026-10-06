import { Place, Places, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { BaseMapModule, PlacesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import {
    createLatestRequest,
    discoverPlaces,
    type FuzzySearchParams,
    getSearchSuggestions,
    type PlaceSuggestion,
    type RefinementSuggestion,
} from '@tomtom-org/maps-sdk/services';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

(async () => {
    const searchBox = document.getElementById('ui-searchBox') as HTMLInputElement;
    const refinementsList = document.getElementById('ui-refinementResults') as HTMLUListElement;
    const placesList = document.getElementById('ui-placeResults') as HTMLUListElement;
    const searchThisAreaButton = document.getElementById('ui-searchThisArea') as HTMLInputElement;
    const loadMoreSlot = document.getElementById('ui-loadMore') as HTMLDivElement;

    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            center: [4.8156, 52.4414],
            zoom: 8,
        },
    });
    const placesModule = await PlacesModule.create(map);
    const baseMapModule = await BaseMapModule.get(map);

    placesList.addEventListener('mouseleave', () => placesModule.clearEventStates({ states: ['hover'] }));

    let selectedRefinement: RefinementSuggestion | undefined;
    let loadNextPage: (() => Promise<void>) | undefined;
    // Each keystroke, pick or page retires whatever the previous one left in flight, so a late
    // response cannot repopulate the lists under a newer query.
    const latestLookup = createLatestRequest();

    const listItem = (lines: string[], onClick?: () => void): HTMLLIElement => {
        const item = document.createElement('li');
        item.classList.add('ui-result-item');
        item.innerHTML = lines.map((line) => `<div class="ui-result-value">${line}</div>`).join('');
        if (onClick) item.addEventListener('click', onClick);

        return item;
    };

    const clearPlaces = () => {
        placesList.innerHTML = '';
        placesModule.clear();
        searchThisAreaButton.innerHTML = '';
        loadMoreSlot.innerHTML = '';
        loadNextPage = undefined;
    };

    const clearAll = () => {
        latestLookup.cancel();
        refinementsList.innerHTML = '';
        clearPlaces();
        searchBox.value = '';
        selectedRefinement = undefined;
    };

    // Places a refinement found: pins on the map, and a list that highlights them.
    const showPlaces = (places: Places) => {
        // Showing places drops their event states, so a further page puts the clicked one back.
        const [clickedID] = placesModule.getEventStates().click ?? [];
        clearPlaces();
        void placesModule.show(places).then(() => {
            if (clickedID !== undefined) placesModule.setEventState({ id: clickedID, state: 'click' });
        });
        for (const place of places.features) {
            const lines = [place.properties.poi?.name, place.properties.address.freeformAddress];
            const item = listItem(
                lines.filter((line) => line !== undefined),
                () => {
                    placesModule.setEventState({ id: place.id, state: 'click', mode: 'put' });
                    map.mapLibreMap.flyTo({ center: place.geometry.coordinates as [number, number], zoom: 15 });
                },
            );
            item.dataset.placeId = place.id;
            item.addEventListener('mouseenter', () =>
                placesModule.setEventState({ id: place.id, state: 'hover', mode: 'put' }),
            );
            placesList.appendChild(item);
        }
        if (!places.features.length) placesList.appendChild(listItem(['No results found']));
    };

    // A refinement's follow-up, narrowed to the current view. Each further page repeats the same
    // parameters with the previous page's `nextCursor`, and there is no further page without one.
    const searchRefinement = async (refinement: RefinementSuggestion) => {
        const request: FuzzySearchParams = {
            ...refinement.refineParams,
            geoBias: { boundingBox: map.getBBox() },
            limit: 20,
        };
        let shown: Place[] = [];

        const showPage = async (cursor?: string) => {
            const page = await latestLookup.run((signal) => discoverPlaces({ ...request, cursor, signal }));
            if (!page.current) return;

            shown = [...shown, ...page.value.features];
            showPlaces({ type: 'FeatureCollection', features: shown });

            const nextCursor = page.value.properties?.nextCursor;
            loadNextPage = nextCursor ? () => showPage(nextCursor) : undefined;
            loadMoreSlot.innerHTML = `<button class="ui-button ui-button-full" ${nextCursor ? '' : 'disabled'}>Load more</button>`;
        };
        await showPage();
    };

    // A location suggestion carries what the list needs; the place itself comes on pick.
    const showLocation = async (location: PlaceSuggestion) => {
        const resolved = await latestLookup.run((signal) => location.resolve(signal));
        if (!resolved.current) return;

        const place = resolved.value;
        showPlaces({ type: 'FeatureCollection', features: [place] });
        map.mapLibreMap.flyTo({ center: place.geometry.coordinates as [number, number], zoom: 15 });
    };

    const suggest = async (query: string) => {
        const response = await latestLookup.run((signal) =>
            getSearchSuggestions({
                query,
                geoBias: { position: map.mapLibreMap.getCenter().toArray() },
                limit: 10,
                signal,
            }),
        );
        if (!response.current) return;

        const { suggestions } = response.value;
        refinementsList.innerHTML = '';
        clearPlaces();
        for (const result of suggestions) {
            if (result.kind === 'brand' || result.kind === 'category') {
                const item = listItem([result.title, result.kind], () => {
                    selectedRefinement = result;
                    searchBox.value = result.title;
                    refinementsList.innerHTML = '';
                    void searchRefinement(result);
                });
                refinementsList.appendChild(item);
            } else {
                placesList.appendChild(listItem([result.title, ...result.subtitles], () => void showLocation(result)));
            }
        }
        if (!suggestions.length) placesList.appendChild(listItem(['No results found']));
    };

    map.mapLibreMap.on('moveend', () => {
        if (selectedRefinement && searchBox.value === selectedRefinement.title) {
            searchThisAreaButton.innerHTML = `<button class="ui-button">Search This Area</button>`;
        }
    });

    searchThisAreaButton.addEventListener('click', () => {
        if (selectedRefinement) void searchRefinement(selectedRefinement);
    });

    loadMoreSlot.addEventListener('click', () => void loadNextPage?.());

    const unhoverListItem = () => placesList.querySelector('.ui-hovered')?.classList.remove('ui-hovered');

    placesModule.events.on('hover', (place) => {
        unhoverListItem();
        placesList.querySelector(`li[data-place-id="${place?.id}"]`)?.classList.add('ui-hovered');
    });

    // Clean up list item hover when hovering outside pins
    baseMapModule.events.on('hover', () => {
        unhoverListItem();
        placesModule.clearEventStates({ states: ['hover'] });
    });

    (document.querySelector('#ui-clearButton') as HTMLButtonElement).addEventListener('click', clearAll);

    searchBox.addEventListener('keyup', () => {
        selectedRefinement = undefined;
        const query = searchBox.value.trim();
        if (query === '') {
            clearAll();
            return;
        }
        void suggest(query);
    });
})();
