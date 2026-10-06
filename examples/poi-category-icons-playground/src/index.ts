import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { calculatePaddedBBox, PlacesModule, POIsModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { createLatestRequest, discoverPlaces } from '@tomtom-org/maps-sdk/services';
import { type CategoryStyle, categories, type PanelCategory, toCategoryIcons } from './categoryIcons';
import { initCategoryRows } from './panel';
import './style.css';
import { API_KEY } from './config';
import { initTogglePanel } from './togglePanel';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

(async () => {
    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            center: [4.8907, 52.3712],
            zoom: 16,
        },
    });
    // The POIs the map style draws, and the places a search finds, drawn as the map draws its POIs
    const pois = await POIsModule.get(map);
    const searchResults = await PlacesModule.create(map, { markerType: 'base-map' });

    const categoryStyles = new Map<PanelCategory, CategoryStyle>(
        categories.map((category) => [category, category.initialStyle]),
    );

    // One list for both modules: each draws its own places of a listed category with that icon
    const applyCategoryIcons = () => {
        const categoryIcons = categories.flatMap((category) =>
            toCategoryIcons(category, categoryStyles.get(category) ?? category.initialStyle),
        );
        pois.updateConfig({ icon: { categoryIcons } });
        searchResults.updateConfig({ icon: { categoryIcons } });
    };

    const searchResultsToggle = document.getElementById('search-results-toggle') as HTMLInputElement;
    // A new map move retires the previous move's search, so a slow answer cannot paint over a newer viewport
    const latestSearch = createLatestRequest();
    const searchViewport = async () => {
        if (!searchResultsToggle.checked) return;

        // Null when the panel leaves too little of the map to search in.
        const boundingBox = calculatePaddedBBox({ map, surroundingElements: ['.ui-customPanel'] });
        if (!boundingBox) return;

        const search = await latestSearch.run((signal) =>
            discoverPlaces({
                filters: { poiCategories: categories.flatMap(({ ids }) => ids) },
                geoBias: { boundingBox },
                limit: 100,
                signal,
            }),
        );
        if (search.current) await searchResults.show(search.value);
    };

    initTogglePanel();
    initCategoryRows((category, style) => {
        categoryStyles.set(category, style);
        applyCategoryIcons();
    });
    (document.getElementById('map-pois-toggle') as HTMLInputElement).addEventListener('change', (event) =>
        pois.setVisible((event.target as HTMLInputElement).checked),
    );
    searchResultsToggle.addEventListener('change', () =>
        searchResultsToggle.checked ? searchViewport() : searchResults.clear(),
    );

    applyCategoryIcons();
    await searchViewport();
    map.mapLibreMap.on('moveend', searchViewport);
})();
