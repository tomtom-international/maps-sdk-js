import type { Place } from '@tomtom-org/maps-sdk/core';
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { calculatePaddedBBox, PlacesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { createLatestRequest, discoverPlaces } from '@tomtom-org/maps-sdk/services';
import './style.css';
import { API_KEY } from './config';
import { CONNECTORS_PROPERTY, initPanel, readClusterConfig, showZoom } from './panel';
import { initTogglePanel } from './togglePanel';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

const countConnectors = (place: Place): number =>
    place.properties.chargingPark?.connectors.reduce((total, { count }) => total + count, 0) ?? 0;

(async () => {
    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            center: [4.8897, 52.3667],
            zoom: 12,
        },
        style: 'monoLight',
    });

    const places = await PlacesModule.create(map, {
        markerType: 'pin-clustered',
        // Every place carries its connector count, which the cluster source sums per cluster.
        extraFeatureProps: { [CONNECTORS_PROPERTY]: countConnectors },
        ...readClusterConfig(),
    });

    // A newer search retires the one in flight, so a slow response cannot repopulate the map.
    const latestSearch = createLatestRequest();
    const searchView = async () => {
        // Null when the panel leaves too little of the map to search in.
        const boundingBox = calculatePaddedBBox({ map, surroundingElements: ['.ui-customPanel'] });
        if (!boundingBox) return;

        const results = await latestSearch.run((signal) =>
            Promise.all(
                (['CHARGING_LOCATION', 'FUEL_STATION'] as const).map((category) =>
                    discoverPlaces({
                        filters: { poiCategories: [category] },
                        geoBias: { boundingBox },
                        limit: 100,
                        signal,
                    }),
                ),
            ),
        );
        if (results.current) await places.show(results.value.flatMap(({ features }) => features));
    };

    initTogglePanel();
    initPanel((config) => {
        places.updateConfig(config);
        showZoom(map.mapLibreMap.getZoom());
    });

    map.mapLibreMap.on('zoom', () => showZoom(map.mapLibreMap.getZoom()));
    map.mapLibreMap.on('moveend', searchView);
    showZoom(map.mapLibreMap.getZoom());
    await searchView();
})();
