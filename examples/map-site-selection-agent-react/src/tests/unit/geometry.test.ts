import type { Feature, Polygon } from 'geojson';
import { describe, expect, it } from 'vitest';
import { clipPolygons, km2 } from '../../agent/geometry';

const box = (minLng: number, minLat: number, maxLng: number, maxLat: number): Feature<Polygon> => ({
    type: 'Feature',
    properties: {},
    geometry: {
        type: 'Polygon',
        coordinates: [
            [
                [minLng, minLat],
                [maxLng, minLat],
                [maxLng, maxLat],
                [minLng, maxLat],
                [minLng, minLat],
            ],
        ],
    },
});

describe('clipPolygons', () => {
    it('returns the overlap of two intersecting polygons', () => {
        const clip = clipPolygons(box(0, 0, 2, 2), box(1, 1, 3, 3));
        expect(clip).not.toBeNull();
        // Overlap is the 1×1 square [1,1]–[2,2] — a quarter of either 2×2 input.
        expect(km2(clip as Feature<Polygon>)).toBeCloseTo(km2(box(1, 1, 2, 2)), 5);
    });

    it('returns null for disjoint polygons', () => {
        expect(clipPolygons(box(0, 0, 1, 1), box(50, 50, 51, 51))).toBeNull();
    });

    it('returns the shared shape when one polygon contains the other', () => {
        const clip = clipPolygons(box(0, 0, 10, 10), box(2, 2, 4, 4));
        expect(km2(clip as Feature<Polygon>)).toBeCloseTo(km2(box(2, 2, 4, 4)), 5);
    });
});

describe('km2', () => {
    it('rounds area to two decimals', () => {
        const value = km2(box(0, 0, 0.01, 0.01));
        expect(value).toBe(Math.round(value * 100) / 100);
    });

    it('scales with polygon size', () => {
        expect(km2(box(0, 0, 2, 2))).toBeGreaterThan(km2(box(0, 0, 1, 1)));
    });

    it('accepts a bare geometry, not just a feature', () => {
        expect(km2(box(0, 0, 1, 1).geometry)).toBeGreaterThan(0);
    });
});
