import type { Place } from '@tomtom-org/maps-sdk/core';
import { createLatestRequest, discoverPlaces } from '@tomtom-org/maps-sdk/services';

export type PlaceSearchBox = {
    /** Writes a place into the box without running a search — for the endpoints picked on load. */
    fill: (place: Place) => void;
};

/** What the box shows for a result: the POI's name when it has one, its address otherwise. */
export const placeLabel = (place: Place): string =>
    place.properties.poi?.name ?? place.properties.address.freeformAddress ?? 'Unnamed place';

/**
 * Turns an input and an empty list into a search box that hands back the picked {@link Place}.
 * Each keystroke supersedes the one before it, so the list only ever shows the newest query.
 */
export const initPlaceSearchBox = (
    input: HTMLInputElement,
    resultsList: HTMLUListElement,
    biasPosition: () => [number, number],
    onPick: (place: Place) => void,
): PlaceSearchBox => {
    // Each keystroke retires whatever the previous one left in flight, or its answer lands on a newer query
    const latestSearch = createLatestRequest();

    const clearResults = () => {
        resultsList.innerHTML = '';
    };

    const showResults = (places: Place[]) => {
        clearResults();
        for (const place of places) {
            const label = placeLabel(place);
            const resultItem = document.createElement('li');
            resultItem.classList.add('ui-result-item');
            resultItem.innerHTML = `
                <div class="ui-result-value">${label}</div>
                <div class="ui-result-type">${place.properties.address.freeformAddress ?? ''}</div>`;
            resultItem.addEventListener('click', () => {
                input.value = label;
                clearResults();
                onPick(place);
            });
            resultsList.appendChild(resultItem);
        }
    };

    input.addEventListener('input', async () => {
        const query = input.value.trim();
        if (query.length < 3) {
            latestSearch.cancel();
            clearResults();
            return;
        }

        const search = await latestSearch.run((signal) =>
            discoverPlaces({ query, typeahead: true, limit: 5, geoBias: { position: biasPosition() }, signal }),
        );
        if (search.current) showResults(search.value.features);
    });

    input.addEventListener('blur', () => setTimeout(clearResults, 150));

    return {
        fill: (place: Place) => {
            input.value = placeLabel(place);
        },
    };
};
