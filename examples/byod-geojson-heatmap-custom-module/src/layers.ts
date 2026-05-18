import type { CustomGeoJSONLayerSpec } from '@tomtom-org/maps-sdk/map';
import { mapStyleLayerIDs } from '@tomtom-org/maps-sdk/map';

/**
 * Layer specs for the `heatmap` source: a single MapLibre heatmap layer that fades out
 * as the user zooms in, placed below TomTom's base-map labels.
 */
export const heatmapLayers: CustomGeoJSONLayerSpec[] = [
    {
        type: 'heatmap',
        maxzoom: 15,
        beforeID: mapStyleLayerIDs.lowestLabel,
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
];

/**
 * Builds the symbol layer for the `markers` source. A symbol layer combines a custom
 * icon (registered via the module's `config.images`) and a text label drawn from the
 * feature's `Name` property.
 */
export const buildMarkersLayers = (iconImageId: string): CustomGeoJSONLayerSpec[] => [
    {
        type: 'symbol',
        minzoom: 13,
        layout: {
            'icon-image': iconImageId,
            'icon-size': ['interpolate', ['linear'], ['zoom'], 13, 0.4, 18, 0.9],
            'icon-allow-overlap': true,
            'text-field': ['get', 'Name'],
            'text-size': 11,
            'text-offset': [0, 1.2],
            'text-anchor': 'top',
            'text-optional': true,
            'text-padding': 2,
        },
        paint: {
            'text-color': '#0a3653',
            'text-halo-color': '#ffffff',
            'text-halo-width': 1.5,
        },
    },
];
