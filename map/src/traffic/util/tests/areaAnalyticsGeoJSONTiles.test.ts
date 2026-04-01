import type { AreaAnalyticsTileEntry } from '@tomtom-org/maps-sdk/core';
import { describe, expect, test } from 'vitest';
import { tilesToPointFeatures } from '../areaAnalyticsGeoJSONTiles';

describe('tilesToPointFeatures', () => {
    test('returns empty FeatureCollection for empty input', () => {
        const result = tilesToPointFeatures([]);
        expect(result.type).toBe('FeatureCollection');
        expect(result.features).toHaveLength(0);
    });

    test('converts a single tile to a Point feature', () => {
        const tiles: AreaAnalyticsTileEntry[] = [
            {
                tileCentre: [-3.7038, 40.4168],
                congestionLevel: 42,
                speed: 35,
                freeFlowSpeed: 60,
                travelTime: 8.5,
            },
        ];

        const result = tilesToPointFeatures(tiles);
        expect(result.features).toHaveLength(1);

        const feature = result.features[0];
        expect(feature.geometry.type).toBe('Point');
        expect(feature.geometry.coordinates).toEqual([-3.7038, 40.4168]);
        expect(feature.properties.congestionLevel).toBe(42);
        expect(feature.properties.speed).toBe(35);
        expect(feature.properties.freeFlowSpeed).toBe(60);
        expect(feature.properties.travelTime).toBe(8.5);
        expect(feature.properties.id).toContain('tile-0');
    });

    test('handles multiple tiles', () => {
        const tiles: AreaAnalyticsTileEntry[] = [
            { tileCentre: [4.89, 52.37], congestionLevel: 10, speed: 50 },
            { tileCentre: [4.9, 52.38], congestionLevel: 80, speed: 20 },
            { tileCentre: [4.91, 52.39], congestionLevel: 55, speed: 30 },
        ];

        const result = tilesToPointFeatures(tiles);
        expect(result.features).toHaveLength(3);
        expect(result.features[0].geometry.coordinates).toEqual([4.89, 52.37]);
        expect(result.features[1].geometry.coordinates).toEqual([4.9, 52.38]);
        expect(result.features[2].geometry.coordinates).toEqual([4.91, 52.39]);
    });

    test('defaults missing metric values to 0', () => {
        const tiles: AreaAnalyticsTileEntry[] = [{ tileCentre: [0, 0] }];

        const result = tilesToPointFeatures(tiles);
        const props = result.features[0].properties;
        expect(props.congestionLevel).toBe(0);
        expect(props.speed).toBe(0);
        expect(props.freeFlowSpeed).toBe(0);
        expect(props.travelTime).toBe(0);
    });

    test('preserves coordinate order as [longitude, latitude]', () => {
        const tiles: AreaAnalyticsTileEntry[] = [{ tileCentre: [-73.9857, 40.7484] }];

        const result = tilesToPointFeatures(tiles);
        const [lon, lat] = result.features[0].geometry.coordinates;
        expect(lon).toBe(-73.9857);
        expect(lat).toBe(40.7484);
    });
});
