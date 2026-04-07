import type { AreaAnalyticsTileEntry, TrafficAreaAnalytics } from '@tomtom-org/maps-sdk/core';
import { bboxFromGeoJSON } from '@tomtom-org/maps-sdk/core';
import { describe, expect, test } from 'vitest';
import { tilesToHexFeatures, tilesToPointFeatures, tilesToSquareFeatures } from '../areaAnalyticsGeoJSONTiles';

// Wraps a tile array into a minimal TrafficAreaAnalytics object.
// The polygon geometry covers all tile centres so bboxFromGeoJSON returns a valid bbox.
const makeAnalytics = (tiles: AreaAnalyticsTileEntry[]): TrafficAreaAnalytics => {
    const lons = tiles.map((t) => t.tileCentre[0]);
    const lats = tiles.map((t) => t.tileCentre[1]);
    const padding = 0.5;
    const minLon = tiles.length ? Math.min(...lons) - padding : -padding;
    const minLat = tiles.length ? Math.min(...lats) - padding : -padding;
    const maxLon = tiles.length ? Math.max(...lons) + padding : padding;
    const maxLat = tiles.length ? Math.max(...lats) + padding : padding;

    return {
        type: 'FeatureCollection',
        properties: {} as TrafficAreaAnalytics['properties'],
        features: [
            (() => {
                const geometry = {
                    type: 'Polygon' as const,
                    coordinates: [
                        [
                            [minLon, minLat],
                            [maxLon, minLat],
                            [maxLon, maxLat],
                            [minLon, maxLat],
                            [minLon, minLat],
                        ],
                    ],
                };
                return {
                    type: 'Feature' as const,
                    id: 'test-region',
                    geometry,
                    bbox: bboxFromGeoJSON(geometry)!,
                    properties: {
                        tiledData: tiles.length ? { tiles } : undefined,
                    } as TrafficAreaAnalytics['features'][number]['properties'],
                };
            })(),
        ],
    };
};

describe('tilesToPointFeatures', () => {
    test('returns empty FeatureCollection for empty input', () => {
        const result = tilesToPointFeatures(makeAnalytics([]));
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

        const result = tilesToPointFeatures(makeAnalytics(tiles));
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

        const result = tilesToPointFeatures(makeAnalytics(tiles));
        expect(result.features).toHaveLength(3);
        expect(result.features[0].geometry.coordinates).toEqual([4.89, 52.37]);
        expect(result.features[1].geometry.coordinates).toEqual([4.9, 52.38]);
        expect(result.features[2].geometry.coordinates).toEqual([4.91, 52.39]);
    });

    test('defaults missing metric values to 0', () => {
        const tiles: AreaAnalyticsTileEntry[] = [{ tileCentre: [0, 0] }];

        const result = tilesToPointFeatures(makeAnalytics(tiles));
        const props = result.features[0].properties;
        expect(props.congestionLevel).toBe(0);
        expect(props.speed).toBe(0);
        expect(props.freeFlowSpeed).toBe(0);
        expect(props.travelTime).toBe(0);
        expect(props.networkLength).toBe(0);
    });

    test('preserves coordinate order as [longitude, latitude]', () => {
        const tiles: AreaAnalyticsTileEntry[] = [{ tileCentre: [-73.9857, 40.7484] }];

        const result = tilesToPointFeatures(makeAnalytics(tiles));
        const [lon, lat] = result.features[0].geometry.coordinates;
        expect(lon).toBe(-73.9857);
        expect(lat).toBe(40.7484);
    });

    test('includes networkLength in properties', () => {
        const tiles: AreaAnalyticsTileEntry[] = [{ tileCentre: [4.9, 52.37], networkLength: 1500 }];

        const result = tilesToPointFeatures(makeAnalytics(tiles));
        expect(result.features[0].properties.networkLength).toBe(1500);
    });

    test('each feature has a stable unique id matching its index and coordinates', () => {
        const tiles: AreaAnalyticsTileEntry[] = [{ tileCentre: [1, 2] }, { tileCentre: [3, 4] }];

        const result = tilesToPointFeatures(makeAnalytics(tiles));
        expect(result.features[0].properties.id).toBe('tile-0-1-2');
        expect(result.features[0].id).toBe('tile-0-1-2');
        expect(result.features[1].properties.id).toBe('tile-1-3-4');
        expect(result.features[1].id).toBe('tile-1-3-4');
    });
});

// Two tiles at identical coordinates but different metric values.
// Because they share the same point the bbox is degenerate; the bbox padding
// in tilesToGridFeatures ensures hexGrid/squareGrid still generates cells, and
// both tiles are guaranteed to land in the same cell (identical coordinates).
const SAME_CENTRE_TILES: AreaAnalyticsTileEntry[] = [
    { tileCentre: [4.9, 52.37], congestionLevel: 20, speed: 40, freeFlowSpeed: 60, travelTime: 6, networkLength: 1000 },
    {
        tileCentre: [4.9, 52.37],
        congestionLevel: 40,
        speed: 60,
        freeFlowSpeed: 80,
        travelTime: 10,
        networkLength: 2000,
    },
];

// Two tiles 1° apart — verified to land in different cells for both hex and square grids.
const SPREAD_TILES: AreaAnalyticsTileEntry[] = [
    { tileCentre: [4, 52], congestionLevel: 10, speed: 70, freeFlowSpeed: 90, travelTime: 4, networkLength: 500 },
    { tileCentre: [5, 53], congestionLevel: 90, speed: 10, freeFlowSpeed: 30, travelTime: 20, networkLength: 1500 },
];

describe('tilesToHexFeatures', () => {
    test('returns empty FeatureCollection for empty input', () => {
        const result = tilesToHexFeatures(makeAnalytics([]));
        expect(result.type).toBe('FeatureCollection');
        expect(result.features).toHaveLength(0);
    });

    test('returns Polygon features for a single tile', () => {
        const result = tilesToHexFeatures(makeAnalytics([{ tileCentre: [4.9, 52.37] }]));
        expect(result.features.length).toBeGreaterThan(0);
        for (const f of result.features) {
            expect(f.geometry.type).toBe('Polygon');
        }
    });

    test('feature ids use "hex-" prefix', () => {
        const result = tilesToHexFeatures(makeAnalytics([{ tileCentre: [4.9, 52.37] }]));
        expect(result.features.length).toBeGreaterThan(0);
        for (const f of result.features) {
            expect(f.properties.id).toMatch(/^hex-/);
            expect(f.id).toMatch(/^hex-/);
        }
    });

    test('tiles at the same centre are aggregated into one cell — metrics are averaged', () => {
        const result = tilesToHexFeatures(makeAnalytics(SAME_CENTRE_TILES));
        expect(result.features).toHaveLength(1);

        const props = result.features[0].properties;
        expect(props.congestionLevel).toBe(Math.round((20 + 40) / 2));
        expect(props.speed).toBe(Math.round((40 + 60) / 2));
        expect(props.freeFlowSpeed).toBe(Math.round((60 + 80) / 2));
        expect(props.travelTime).toBe(Math.round(((6 + 10) / 2) * 10) / 10);
        expect(props.networkLength).toBe(Math.round((1000 + 2000) / 2));
    });

    test('tiles 1° apart produce separate features', () => {
        const result = tilesToHexFeatures(makeAnalytics(SPREAD_TILES));
        expect(result.features.length).toBeGreaterThanOrEqual(2);
    });

    test('defaults missing metric values to 0 when aggregating', () => {
        const result = tilesToHexFeatures(makeAnalytics([{ tileCentre: [4.9, 52.37] }]));
        expect(result.features.length).toBeGreaterThan(0);

        const props = result.features[0].properties;
        expect(props.congestionLevel).toBe(0);
        expect(props.speed).toBe(0);
        expect(props.freeFlowSpeed).toBe(0);
        expect(props.travelTime).toBe(0);
        expect(props.networkLength).toBe(0);
    });
});

describe('tilesToSquareFeatures', () => {
    test('returns empty FeatureCollection for empty input', () => {
        const result = tilesToSquareFeatures(makeAnalytics([]));
        expect(result.type).toBe('FeatureCollection');
        expect(result.features).toHaveLength(0);
    });

    test('returns Polygon features for a single tile', () => {
        const result = tilesToSquareFeatures(makeAnalytics([{ tileCentre: [4.9, 52.37] }]));
        expect(result.features.length).toBeGreaterThan(0);
        for (const f of result.features) {
            expect(f.geometry.type).toBe('Polygon');
        }
    });

    test('feature ids use "square-" prefix', () => {
        const result = tilesToSquareFeatures(makeAnalytics([{ tileCentre: [4.9, 52.37] }]));
        expect(result.features.length).toBeGreaterThan(0);
        for (const f of result.features) {
            expect(f.properties.id).toMatch(/^square-/);
            expect(f.id).toMatch(/^square-/);
        }
    });

    test('tiles at the same centre are aggregated into one cell — metrics are averaged', () => {
        const result = tilesToSquareFeatures(makeAnalytics(SAME_CENTRE_TILES));
        expect(result.features).toHaveLength(1);

        const props = result.features[0].properties;
        expect(props.congestionLevel).toBe(Math.round((20 + 40) / 2));
        expect(props.speed).toBe(Math.round((40 + 60) / 2));
        expect(props.freeFlowSpeed).toBe(Math.round((60 + 80) / 2));
        expect(props.travelTime).toBe(Math.round(((6 + 10) / 2) * 10) / 10);
        expect(props.networkLength).toBe(Math.round((1000 + 2000) / 2));
    });

    test('tiles 1° apart produce separate features', () => {
        const result = tilesToSquareFeatures(makeAnalytics(SPREAD_TILES));
        expect(result.features.length).toBeGreaterThanOrEqual(2);
    });

    test('defaults missing metric values to 0 when aggregating', () => {
        const result = tilesToSquareFeatures(makeAnalytics([{ tileCentre: [4.9, 52.37] }]));
        expect(result.features.length).toBeGreaterThan(0);

        const props = result.features[0].properties;
        expect(props.congestionLevel).toBe(0);
        expect(props.speed).toBe(0);
        expect(props.freeFlowSpeed).toBe(0);
        expect(props.travelTime).toBe(0);
        expect(props.networkLength).toBe(0);
    });
});
