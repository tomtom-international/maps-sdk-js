import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { PlacesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import './style.css';
import { API_KEY } from './config';
import { addHeatmapLayer } from './heatmapLayers';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY });

const map = new TomTomMap({
    container: 'sdk-map',
    center: [-1.7, 53.75],
    zoom: 9.5,
});

const DATA_URL = 'https://dataworks.calderdale.gov.uk/download/2kyp8/hcj/listed%20buildings%20west%20yorkshire.json';
(async () => {
    const geojson = await (await fetch(DATA_URL)).json();

    if (!map.mapLibreMap.isStyleLoaded()) {
        await map.mapLibreMap.once('styledata');
    }

    map.mapLibreMap.addSource('heatmap-data', { type: 'geojson', data: geojson });
    addHeatmapLayer(map.mapLibreMap, 'heatmap-data');

    // Initialize PlacesModule with base-map theme
    const placesModule = await PlacesModule.get(map, {
        theme: 'base-map',
        icon: {
            mapping: { to: 'poiCategory', fn: () => 'COMPANY' },
        },
        text: {
            title: (place) => place.properties.Name,
        },
        layers: { main: { minzoom: 15 } },
    });

    await placesModule.show(geojson);
})();
