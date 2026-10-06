import { mapStyleLayerIDs } from '@tomtom-org/maps-sdk/map';
import type { GeoJSON } from 'geojson';
import type { Map } from 'maplibre-gl';

/**
 * Add heatmap layer to the map
 */
export const addHeatmapSourceAndLayer = async (map: Map, data: GeoJSON) => {
    if (!map.isStyleLoaded()) {
        await map.once('styledata');
    }

    const sourceId = 'heatmap-data';
    map.addSource(sourceId, { type: 'geojson', data });
    map.addLayer(
        {
            id: 'heatmap-layer',
            type: 'heatmap',
            source: sourceId,
            paint: {
                'heatmap-weight': ['interpolate', ['linear'], ['zoom'], 8, 0.5, 12, 1, 22, 10],
                'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 8, 0.5, 15, 1.5],
                'heatmap-color': [
                    'interpolate',
                    ['linear'],
                    ['heatmap-density'],
                    0,
                    'rgba(33,102,172,0)',
                    0.2,
                    'rgb(150,150,150)',
                    0.4,
                    'rgb(209,229,240)',
                    0.6,
                    'rgb(253,219,199)',
                    0.7,
                    'rgb(239,138,98)',
                    1,
                    'rgb(178,24,43)',
                ],
                'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 8, 10, 15, 20],
                'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 8, 0.5, 16, 0.8],
            },
        },
        mapStyleLayerIDs.lowestLabel,
    );
};
