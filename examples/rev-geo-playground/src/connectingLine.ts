import type { Position } from 'geojson';
import type { GeoJSONSource, Map } from 'maplibre-gl';

const SOURCE_ID = 'connecting-line';
const LAYER_ID = 'connecting-line-layer';

export const initConnectingLine = (map: Map): void => {
    // Add a source and layer for the connecting line
    map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: [] },
            properties: {},
        },
    });

    map.addLayer({
        id: LAYER_ID,
        type: 'line',
        source: SOURCE_ID,
        layout: {
            'line-cap': 'round',
            'line-join': 'round',
        },
        paint: {
            'line-color': '#df1b12',
            'line-width': 2,
            'line-opacity': 0.5,
            'line-dasharray': [2, 4],
        },
    });
};

export const getConnectingLineSource = (map: Map): GeoJSONSource => map.getSource(SOURCE_ID) as GeoJSONSource;

export const updateConnectingLine = (map: Map, coordinates: Position[]): void => {
    getConnectingLineSource(map).setData({
        type: 'Feature',
        geometry: {
            type: 'LineString',
            coordinates,
        },
        properties: {},
    });
};

export const clearConnectingLine = (map: Map): void => updateConnectingLine(map, []);
