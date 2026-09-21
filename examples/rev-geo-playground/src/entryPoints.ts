import type { EntryPoint } from '@tomtom-org/maps-sdk/core';
import type { FeatureCollection, Position } from 'geojson';
import type { GeoJSONSource, Map } from 'maplibre-gl';

const SOURCE_ID = 'entry-points';
const LINE_LAYER_ID = 'entry-points-line-layer';
const CIRCLE_LAYER_ID = 'entry-points-circle-layer';

const EMPTY_FEATURES: FeatureCollection = { type: 'FeatureCollection', features: [] };

export const initEntryPoints = (map: Map): void => {
    map.addSource(SOURCE_ID, { type: 'geojson', data: EMPTY_FEATURES });

    map.addLayer({
        id: LINE_LAYER_ID,
        type: 'line',
        source: SOURCE_ID,
        filter: ['==', ['geometry-type'], 'LineString'],
        layout: { 'line-cap': 'round' },
        paint: { 'line-color': '#004b7f', 'line-width': 2, 'line-opacity': 0.5 },
    });

    map.addLayer({
        id: CIRCLE_LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        filter: ['==', ['geometry-type'], 'Point'],
        paint: {
            'circle-radius': 6,
            'circle-color': '#004b7f',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
        },
    });
};

const entryPointsSource = (map: Map): GeoJSONSource => map.getSource(SOURCE_ID) as GeoJSONSource;

export const showEntryPoints = (map: Map, addressPosition: Position, entryPoints: EntryPoint[]): void => {
    entryPointsSource(map).setData({
        type: 'FeatureCollection',
        features: entryPoints.flatMap((entryPoint) => [
            { type: 'Feature', geometry: { type: 'Point', coordinates: entryPoint.position }, properties: {} },
            {
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: [addressPosition, entryPoint.position] },
                properties: {},
            },
        ]),
    });
};

export const clearEntryPoints = (map: Map): void => {
    entryPointsSource(map).setData(EMPTY_FEATURES);
};
