import type { CustomGeoJSONLayerSpec } from '@tomtom-org/maps-sdk/map';

// Two layers on the clustered point source: one for clusters (with a count label
// on top), one for individual points.
export const pointLayers: CustomGeoJSONLayerSpec[] = [
    {
        id: 'clusters',
        type: 'circle',
        filter: ['has', 'point_count'],
        paint: {
            'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 100, '#f1f075', 1000, '#f28cb1'],
            'circle-radius': ['step', ['get', 'point_count'], 16, 100, 22, 1000, 28],
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1.5,
        },
    },
    {
        id: 'cluster-count',
        type: 'symbol',
        filter: ['has', 'point_count'],
        layout: {
            'text-field': ['get', 'point_count_abbreviated'],
            'text-size': 12,
        },
        paint: {
            'text-color': '#0a3653',
        },
    },
    {
        id: 'individual-points',
        type: 'circle',
        filter: ['!', ['has', 'point_count']],
        paint: {
            'circle-radius': 4,
            'circle-color': '#0a3653',
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1,
        },
    },
];

// Polygon source: fill + outline.
export const polygonLayers: CustomGeoJSONLayerSpec[] = [
    {
        id: 'polygon-fill',
        type: 'fill',
        paint: {
            'fill-color': '#1e88e5',
            'fill-opacity': 0.25,
        },
    },
    {
        id: 'polygon-outline',
        type: 'line',
        paint: {
            'line-color': '#1565c0',
            'line-width': 1.5,
        },
    },
];
