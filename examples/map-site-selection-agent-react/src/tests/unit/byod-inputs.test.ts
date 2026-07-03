import type { ToolState } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import type { Feature, FeatureCollection, LineString, Point, Polygon } from 'geojson';
import { describe, expect, it } from 'vitest';
import { byodCandidateSites, requireByodFeatures, sumNumericInArea } from '../../agent/byod-inputs';

const point = (lng: number, lat: number, properties: Record<string, unknown>): Feature<Point> => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [lng, lat] },
    properties,
});

const fc = (features: Feature[]): FeatureCollection => ({ type: 'FeatureCollection', features });

// A rectangle [minLng,minLat]–[maxLng,maxLat] as a Polygon feature — used both as a "catchment" area
// and as a demand cell in the join tests.
const box = (
    minLng: number,
    minLat: number,
    maxLng: number,
    maxLat: number,
    properties: Record<string, unknown> = {},
): Feature<Polygon> => ({
    type: 'Feature',
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
    properties,
});

// A 0,0 → 10,10 square used as the "catchment" area for the join tests.
const SQUARE: Polygon = box(0, 0, 10, 10).geometry;

// A ToolState is only narrowed to read `.byod`, so a byod-only stub is enough.
const stateWithByod = (id: string, data: FeatureCollection): ToolState =>
    ({
        byod: { findById: (queried: string) => (queried === id ? { id, data } : undefined), entries: [{ id }] },
    }) as unknown as ToolState;

describe('byodCandidateSites', () => {
    it('keeps Point features as-is, labelling from name/label', () => {
        const sites = byodCandidateSites(fc([point(1, 1, { name: 'Alpha' }), point(2, 2, { label: 'Beta' })]));
        expect(sites).toEqual([
            { label: 'Alpha', position: [1, 1] },
            { label: 'Beta', position: [2, 2] },
        ]);
    });

    it('falls back to "Site N" when no label-like property is present', () => {
        const [site] = byodCandidateSites(fc([point(3, 3, { unrelated: 'x' })]));
        expect(site).toEqual({ label: 'Site 1', position: [3, 3] });
    });

    it('reduces a Polygon feature (e.g. a parcel) to a representative point instead of dropping it', () => {
        const sites = byodCandidateSites(fc([box(2, 2, 6, 6, { name: 'Parcel' })]));
        expect(sites).toHaveLength(1);
        expect(sites[0].label).toBe('Parcel');
        // The centroid falls inside the parcel's bounds — the exact formula is turf's concern.
        const [lng, lat] = sites[0].position;
        expect(lng).toBeGreaterThan(2);
        expect(lng).toBeLessThan(6);
        expect(lat).toBeGreaterThan(2);
        expect(lat).toBeLessThan(6);
    });

    it('reduces a LineString feature to a representative point', () => {
        const line: Feature<LineString> = {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: [
                    [0, 0],
                    [4, 4],
                ],
            },
            properties: { title: 'Frontage' },
        };
        const [site] = byodCandidateSites(fc([line]));
        expect(site.label).toBe('Frontage');
        expect(site.position[0]).toBeGreaterThan(0);
        expect(site.position[0]).toBeLessThan(4);
    });

    it('mixes geometry types — one candidate per feature', () => {
        const sites = byodCandidateSites(fc([point(1, 1, { name: 'P' }), box(2, 2, 6, 6, { name: 'Poly' })]));
        expect(sites.map((s) => s.label)).toEqual(['P', 'Poly']);
    });

    it('labels from a caller-named property the heuristic would miss (e.g. Berlin Bezirke spatial_alias)', () => {
        // The Berlin districts layer carries its name in `spatial_alias`, which is NOT in LABEL_KEYS —
        // the whole point of letting the LLM name the label field from the addByodSource profile.
        const sites = byodCandidateSites(
            fc([box(0, 0, 2, 2, { spatial_alias: 'Mitte' }), box(3, 3, 5, 5, { spatial_alias: 'Pankow' })]),
            'spatial_alias',
        );
        expect(sites.map((s) => s.label)).toEqual(['Mitte', 'Pankow']);
    });

    it('falls back to the heuristic, then "Site N", when the named property is missing on a feature', () => {
        const sites = byodCandidateSites(
            fc([point(1, 1, { region: 'North', name: 'Alpha' }), point(2, 2, { other: 'x' })]),
            'region',
        );
        // First: named `region` wins. Second: no `region` → LABEL_KEYS finds nothing → "Site 2".
        expect(sites.map((s) => s.label)).toEqual(['North', 'Site 2']);
    });
});

describe('sumNumericInArea', () => {
    it('sums the named numeric property over the points inside the area', () => {
        const result = sumNumericInArea(
            fc([point(1, 1, { spend: 5 }), point(2, 2, { spend: 3 }), point(20, 20, { spend: 100 })]),
            SQUARE,
            'spend',
        );
        expect(result).toEqual({ value: 8, matched: 2 });
    });

    it('matches nothing (value 0) when the named property is absent or non-numeric', () => {
        const result = sumNumericInArea(fc([point(1, 1, { name: 'a' })]), SQUARE, 'spend');
        expect(result).toEqual({ value: 0, matched: 0 });
    });

    it('counts a polygon fully inside the area at its full value', () => {
        const result = sumNumericInArea(fc([box(2, 2, 4, 4, { population: 42 })]), SQUARE, 'population');
        expect(result.matched).toBe(1);
        expect(result.value).toBeCloseTo(42, 5);
    });

    it('area-weights a polygon that only partly overlaps the area', () => {
        // The cell spans lng 8→12; SQUARE ends at 10, so exactly half its width is inside. Same latitude
        // band → area is proportional to width, so half the population should be counted.
        const result = sumNumericInArea(fc([box(8, 2, 12, 4, { population: 100 })]), SQUARE, 'population');
        expect(result.matched).toBe(1);
        expect(result.value).toBeCloseTo(50, 0);
    });

    it('ignores a polygon that does not overlap the area at all', () => {
        const result = sumNumericInArea(fc([box(20, 20, 30, 30, { population: 100 })]), SQUARE, 'population');
        expect(result).toEqual({ value: 0, matched: 0 });
    });
});

describe('requireByodFeatures', () => {
    it('returns the entry data when the id is loaded', () => {
        const data = fc([point(1, 1, { name: 'a' })]);
        expect(requireByodFeatures(stateWithByod('e1', data), 'e1')).toBe(data);
    });

    it('throws a helpful error naming the missing id when not loaded', () => {
        const state = stateWithByod('e1', fc([]));
        expect(() => requireByodFeatures(state, 'nope')).toThrowError(/No BYOD layer "nope"/);
    });
});
