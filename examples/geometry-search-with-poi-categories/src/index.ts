import { bboxFromGeoJSON, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { GeometriesModule, PlacesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { createLatestRequest, discoverPlaces, geocodeOne, geometryData } from '@tomtom-org/maps-sdk/services';
import './style.css';
import type { CategorySearch } from './categoryWords';
import { API_KEY } from './config';
import { initPanel, readSearch, showStatus } from './panel';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY });

(async () => {
    const areaToSearch = await geocodeOne('paris');

    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            fitBoundsOptions: { padding: 50 },
            bounds: bboxFromGeoJSON(areaToSearch),
        },
    });

    const areaGeometry = await geometryData({ geometries: [areaToSearch] });
    const geometryModule = await GeometriesModule.create(map, { fill: { style: 'inverted' } });
    geometryModule.show(areaGeometry);

    const placesModule = await PlacesModule.create(map);
    const latestSearch = createLatestRequest();

    const searchCategory = async ({ poiCategoryQuery, language }: CategorySearch) => {
        showStatus('Searching…');
        try {
            const search = await latestSearch.run((signal) =>
                discoverPlaces({
                    filters: { poiCategoryQuery },
                    language,
                    geometries: [areaGeometry],
                    limit: 100,
                    signal,
                }),
            );
            if (!search.current) return;

            placesModule.show(search.value);
            showStatus(`${search.value.features.length} places in Paris`);
        } catch (error) {
            placesModule.clear();
            showStatus(error instanceof Error ? error.message : String(error));
        }
    };

    initPanel(searchCategory);
    await searchCategory(readSearch());
})();
