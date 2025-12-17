import type { PolygonFeatures } from '@tomtom-org/maps-sdk/core';
import { describe, expect, test } from 'vitest';
import type { ColorPaletteOptions } from '../layers/geometryLayers';
import { colorPalettes } from '../layers/geometryLayers';
import {
    buildGeometryLayerSpecs,
    buildGeometryTitleLayerSpec,
    prepareGeometryForDisplay,
    prepareTitleForDisplay,
} from '../prepareGeometryForDisplay';
import type { GeometriesModuleConfig } from '../types/geometriesModuleConfig';

describe('prepareGeometryForDisplay', () => {
    test('Build geometry spec layer', () => {
        const config: GeometriesModuleConfig = {
            colorConfig: {
                fillOpacity: 1,
                fillColor: '#00ffaa',
            },
            lineConfig: {
                lineColor: '#00ffbb',
                lineWidth: 2,
                lineOpacity: 0.3,
            },
        };

        const [fillLayerSpec, outLineLayerSpec] = buildGeometryLayerSpecs('fillID', 'outlineID', config);

        expect(fillLayerSpec).toMatchObject({
            type: 'fill',
            id: 'fillID',
            paint: {
                'fill-color': ['get', 'color'],
                'fill-opacity': config.colorConfig?.fillOpacity,
                'fill-antialias': false,
            },
        });

        expect(outLineLayerSpec).toMatchObject({
            type: 'line',
            id: 'outlineID',
            paint: {
                'line-color': config.lineConfig?.lineColor,
                'line-opacity': config.lineConfig?.lineOpacity,
                'line-width': config.lineConfig?.lineWidth,
            },
        });
    });

    test('Build geometry title spec layer', () => {
        let config: GeometriesModuleConfig = { textConfig: { textField: 'title' } };
        let geometryTitleSpec = buildGeometryTitleLayerSpec('titleLayerID', config);

        expect(geometryTitleSpec).toHaveProperty('id', 'titleLayerID');
        expect(geometryTitleSpec.layout).toHaveProperty('text-field', 'title');

        // Using Maplibre expressions
        config = { textConfig: { textField: ['get', 'name'] } };
        geometryTitleSpec = buildGeometryTitleLayerSpec('anotherTitleLayerID', config);
        expect(geometryTitleSpec).toHaveProperty('id', 'anotherTitleLayerID');
        expect(geometryTitleSpec.layout).toHaveProperty('text-field', config.textConfig?.textField);
    });

    test('Prepare geometry for display', () => {
        const geometry: PolygonFeatures = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    bbox: [0, 0, 1, 1],
                    properties: { title: 'TomTom' },
                    geometry: { type: 'Polygon', coordinates: [] },
                },
                {
                    type: 'Feature',
                    bbox: [0, 0, 1, 1],
                    properties: { address: { freeformAddress: 'TomTom' }, color: '#00aabb' },
                    geometry: { type: 'Polygon', coordinates: [] },
                },
            ],
        };

        const config: GeometriesModuleConfig = { colorConfig: { fillColor: 'warm' } };

        const results = prepareGeometryForDisplay(geometry, config);

        expect(results.features[0].properties).toHaveProperty('color');
        expect(colorPalettes[config.colorConfig?.fillColor as ColorPaletteOptions]).toContain(
            results.features[0].properties?.color,
        );
        expect(results.features[0].properties).toHaveProperty('title', 'TomTom');
        expect(results.features[1].properties).toHaveProperty('title', 'TomTom');
        expect(results.features[1].properties).toHaveProperty('color', '#00aabb');
    });

    test('Prepare geometry for display with undefined title and color', () => {
        const geometry: PolygonFeatures = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    bbox: [0, 0, 1, 1],
                    properties: {},
                    geometry: { type: 'Polygon', coordinates: [] },
                },
            ],
        };

        const config: GeometriesModuleConfig = {};

        const results = prepareGeometryForDisplay(geometry, config);

        expect(results.features[0].properties).not.toHaveProperty('color');
        expect(results.features[0].properties).not.toHaveProperty('title');
        expect(results.features[0].properties).toHaveProperty('id');
    });

    test('Prepare title for display', () => {
        const geometries: PolygonFeatures = {
            type: 'FeatureCollection',
            features: [
                {
                    bbox: [-7.1036325, 43.4264427, -7.1036325, 43.4264427],
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[[-7.1036325, 43.4264427]]],
                    },
                } as import('@tomtom-org/maps-sdk/core').PolygonFeature<any>,
                {
                    bbox: [-7.1036325, 43.4264427, -7.1036325, 43.4264427],
                    type: 'Feature',
                    properties: {
                        placeCoordinates: [[-7.1036325, 43.4264427]],
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [],
                    },
                } as import('@tomtom-org/maps-sdk/core').PolygonFeature<any>,
                {
                    bbox: [100, 0, 103, 3],
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'MultiPolygon',
                        coordinates: [
                            [
                                [
                                    [102.0, 2.0],
                                    [103.0, 2.0],
                                    [103.0, 3.0],
                                    [102.0, 3.0],
                                    [102.0, 2.0],
                                ],
                            ],
                            [
                                [
                                    [100.0, 0.0],
                                    [101.0, 0.0],
                                    [101.0, 1.0],
                                    [100.0, 1.0],
                                    [100.0, 0.0],
                                ],
                                [
                                    [100.2, 0.2],
                                    [100.8, 0.2],
                                    [100.8, 0.8],
                                    [100.2, 0.8],
                                    [100.2, 0.2],
                                ],
                            ],
                        ],
                    },
                } as import('@tomtom-org/maps-sdk/core').PolygonFeature<any>,
            ],
        };

        expect(prepareTitleForDisplay(geometries)).toMatchObject({
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [[-7.1036325, 43.4264427]] },
                    properties: {},
                },
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [[-7.1036325, 43.4264427]] },
                    properties: { placeCoordinates: [[-7.1036325, 43.4264427]] },
                },
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [102.5, 2.5] },
                    properties: {},
                },
            ],
        });
    });
});
