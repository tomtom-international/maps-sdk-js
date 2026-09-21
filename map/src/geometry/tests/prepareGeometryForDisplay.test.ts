import type { PolygonFeature, PolygonFeatures } from '@tomtom-org/maps-sdk/core';
import { describe, expect, test } from 'vitest';
import { adaptPaletteForTheme, type ColorPaletteOptions, colorPalettes } from '../layers/colorPalettes';
import { TURF_MASK_WORLD_RING } from '../layers/constants';
import { buildGeometryLayerSpecs, buildGeometryTitleLayerSpec } from '../layers/geometryLayers';
import { prepareGeometryForDisplay, prepareTitleForDisplay } from '../prepareGeometryForDisplay';
import type { GeometriesModuleConfig } from '../types/geometriesModuleConfig';

describe('prepareGeometryForDisplay', () => {
    test('Build geometry spec layer', () => {
        const config: GeometriesModuleConfig = {
            fill: {
                opacity: 1,
                color: '#00ffaa',
            },
            line: {
                color: '#00ffbb',
                width: 2,
                opacity: 0.3,
            },
        };

        const [fillLayerSpec, outLineLayerSpec] = buildGeometryLayerSpecs('fillID', 'outlineID', config);

        expect(fillLayerSpec).toMatchObject({
            type: 'fill',
            id: 'fillID',
            paint: {
                'fill-color': ['get', 'color'],
                'fill-opacity': config.fill?.opacity,
                'fill-antialias': false,
            },
        });

        expect(outLineLayerSpec).toMatchObject({
            type: 'line',
            id: 'outlineID',
            paint: {
                'line-color': config.line?.color,
                'line-opacity': config.line?.opacity,
                'line-width': config.line?.width,
            },
        });
    });

    test('Build geometry title spec layer', () => {
        let config: GeometriesModuleConfig = { textConfig: { textField: 'title' } };
        let geometryTitleSpec = buildGeometryTitleLayerSpec('titleLayerID', config);

        expect(geometryTitleSpec).toHaveProperty('id', 'titleLayerID');
        expect(geometryTitleSpec.layout).toHaveProperty('text-field', 'title');
        expect(geometryTitleSpec.paint).toMatchObject({ 'text-color': '#333333', 'text-halo-color': '#FFFFFF' });

        // Using Maplibre expressions
        config = { textConfig: { textField: ['get', 'name'] } };
        geometryTitleSpec = buildGeometryTitleLayerSpec('anotherTitleLayerID', config);
        expect(geometryTitleSpec).toHaveProperty('id', 'anotherTitleLayerID');
        expect(geometryTitleSpec.layout).toHaveProperty('text-field', config.textConfig?.textField);

        // Dark theme swaps title text and halo colours
        geometryTitleSpec = buildGeometryTitleLayerSpec('darkTitleLayerID', config, 'dark');
        expect(geometryTitleSpec.paint).toMatchObject({ 'text-color': '#FFFFFF', 'text-halo-color': '#333333' });
    });

    test('adaptPaletteForTheme', () => {
        expect(adaptPaletteForTheme(colorPalettes.fadedRainbow, 'light')).toBe(colorPalettes.fadedRainbow);

        const dark = adaptPaletteForTheme(colorPalettes.fadedRainbow, 'dark');
        expect(dark).not.toEqual(colorPalettes.fadedRainbow);
        // pale pastel '#ffadad' is deepened
        expect(dark[0]).not.toBe('#ffadad');
        expect(dark).toHaveLength(colorPalettes.fadedRainbow.length);
        for (const color of dark) {
            expect(color).toMatch(/^#[0-9a-f]{6}$/i);
        }

        // near-black ramp entries are lifted rather than darkened further
        const darkBlues = adaptPaletteForTheme(colorPalettes.fadedBlues, 'dark');
        expect(darkBlues[0]).not.toBe('#152033');
    });

    test('prepareGeometryForDisplay adapts palette colours for the dark theme', () => {
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
        const config: GeometriesModuleConfig = { fill: { color: 'fadedRainbow' } };

        const light = prepareGeometryForDisplay(geometry, config, 'light');
        const dark = prepareGeometryForDisplay(geometry, config, 'dark');

        expect(light.features[0].properties?.color).toBe(colorPalettes.fadedRainbow[0]);
        expect(dark.features[0].properties?.color).not.toBe(colorPalettes.fadedRainbow[0]);
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

        const config: GeometriesModuleConfig = { fill: { color: 'warm' } };

        const results = prepareGeometryForDisplay(geometry, config);

        expect(results.features[0].properties).toHaveProperty('color');
        expect(colorPalettes[config.fill?.color as ColorPaletteOptions]).toContain(
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

    test('auto-inverts features with theme inverted into donut polygons', () => {
        const ring = [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0],
        ];
        const geometry: PolygonFeatures = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    bbox: [0, 0, 1, 1],
                    properties: { theme: 'inverted', title: 'Inverted zone' },
                    geometry: { type: 'Polygon', coordinates: [ring] },
                } as PolygonFeature,
            ],
        };

        const results = prepareGeometryForDisplay(geometry);

        expect(results.features[0].geometry.coordinates[0]).toEqual(TURF_MASK_WORLD_RING);
        expect(results.features[0].geometry.coordinates[1]).toEqual(ring);
        expect(results.features[0].properties).toHaveProperty('title', 'Inverted zone');
    });

    test('leaves filled and outline features unchanged', () => {
        const ring = [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0],
        ];
        const geometry: PolygonFeatures = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    bbox: [0, 0, 1, 1],
                    properties: { theme: 'filled' },
                    geometry: { type: 'Polygon', coordinates: [ring] },
                } as PolygonFeature,
                {
                    type: 'Feature',
                    bbox: [0, 0, 1, 1],
                    properties: { theme: 'outline' },
                    geometry: { type: 'Polygon', coordinates: [ring] },
                } as PolygonFeature,
                {
                    type: 'Feature',
                    bbox: [0, 0, 1, 1],
                    properties: {},
                    geometry: { type: 'Polygon', coordinates: [ring] },
                } as PolygonFeature,
            ],
        };

        const results = prepareGeometryForDisplay(geometry);

        for (const feature of results.features) {
            expect(feature.geometry.coordinates[0]).toEqual(ring);
        }
    });

    test('handles mixed themes with auto-inversion', () => {
        const ring = [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0],
        ];
        const geometry: PolygonFeatures = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    bbox: [0, 0, 1, 1],
                    properties: { theme: 'filled', title: 'A' },
                    geometry: { type: 'Polygon', coordinates: [ring] },
                } as PolygonFeature,
                {
                    type: 'Feature',
                    bbox: [0, 0, 1, 1],
                    properties: { theme: 'inverted', title: 'B' },
                    geometry: { type: 'Polygon', coordinates: [ring] },
                } as PolygonFeature,
                {
                    type: 'Feature',
                    bbox: [0, 0, 1, 1],
                    properties: { theme: 'outline', title: 'C' },
                    geometry: { type: 'Polygon', coordinates: [ring] },
                } as PolygonFeature,
            ],
        };

        const results = prepareGeometryForDisplay(geometry);

        expect(results.features[0].geometry.coordinates[0]).toEqual(ring);
        expect(results.features[1].geometry.coordinates[0]).toEqual(TURF_MASK_WORLD_RING);
        expect(results.features[2].geometry.coordinates[0]).toEqual(ring);
    });

    test('applies config-level theme to features without theme property', () => {
        const ring = [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0],
        ];
        const geometry: PolygonFeatures = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    bbox: [0, 0, 1, 1],
                    properties: { title: 'Germany' },
                    geometry: { type: 'Polygon', coordinates: [ring] },
                } as PolygonFeature,
            ],
        };

        const results = prepareGeometryForDisplay(geometry, { theme: 'inverted' });

        expect(results.features[0].geometry.coordinates[0]).toEqual(TURF_MASK_WORLD_RING);
        expect(results.features[0].properties).toHaveProperty('theme', 'inverted');
        expect(results.features[0].properties).toHaveProperty('title', 'Germany');
    });

    test('feature-level theme overrides config-level theme', () => {
        const ring = [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0],
        ];
        const geometry: PolygonFeatures = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    bbox: [0, 0, 1, 1],
                    properties: { theme: 'filled', title: 'Keep filled' },
                    geometry: { type: 'Polygon', coordinates: [ring] },
                } as PolygonFeature,
            ],
        };

        const results = prepareGeometryForDisplay(geometry, { theme: 'inverted' });

        // Feature-level theme='filled' takes precedence over config theme='inverted'
        expect(results.features[0].geometry.coordinates[0]).toEqual(ring);
        expect(results.features[0].properties).toHaveProperty('theme', 'filled');
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
