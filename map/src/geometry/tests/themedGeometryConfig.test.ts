import type { PolygonFeature } from '@tomtom-org/maps-sdk/core';
import { describe, expect, test } from 'vitest';
import { invertFeature } from '../../../src/geometry/prepareGeometryForDisplay';
import { themedGeometryConfig } from '../geometryConfigs';
import { TURF_MASK_WORLD_RING } from '../layers/constants';

const makeFeature = (coords: number[][][], props: Record<string, unknown> = {}): PolygonFeature =>
    ({
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: coords },
        properties: props,
    }) as PolygonFeature;

describe('invertFeature', () => {
    test('wraps the polygon as a hole inside WORLD_RING', () => {
        const ring = [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0],
        ];
        const feature = makeFeature([ring], { title: 'Zone A', theme: 'inverted' });
        const inverted = invertFeature(feature);

        expect(inverted.geometry.coordinates[0]).toEqual(TURF_MASK_WORLD_RING);
        expect(inverted.geometry.coordinates[1]).toEqual(ring);
    });

    test('preserves existing properties', () => {
        const ring = [
            [0, 0],
            [1, 0],
            [1, 2],
            [0, 2],
            [0, 0],
        ];
        const feature = makeFeature([ring], { title: 'Test', color: '#ff0000' });
        const inverted = invertFeature(feature);

        expect(inverted.properties?.title).toBe('Test');
        expect(inverted.properties?.color).toBe('#ff0000');
    });
});

describe('themedGeometryConfig', () => {
    test('does not include transformFeaturesForDisplay (inversion is handled by prepareGeometryForDisplay)', () => {
        const config = themedGeometryConfig();
        expect(config.transformFeaturesForDisplay).toBeUndefined();
    });

    test('returns config with data-driven styling for themes', () => {
        const config = themedGeometryConfig('fadedRainbow');
        expect(config.colorConfig?.fillColor).toBe('fadedRainbow');
        expect(config.lineConfig).toBeDefined();
        expect(config.beforeLayerConfig).toBe('lowestLabel');
    });
});
