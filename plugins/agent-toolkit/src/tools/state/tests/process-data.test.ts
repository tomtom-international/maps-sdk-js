import type { Feature, Point } from 'geojson';
import { describe, expect, it } from 'vitest';
import { validatePlaces } from '../process-data';

// A canonical processData-produced place: Point geometry, a `poi.name` display label, and a
// `type` from the PlaceType enum. Overrides let each test bend one part out of shape.
const makePlace = (overrides: Record<string, unknown> = {}): Feature<Point> =>
    ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [4.9, 52.4] },
        properties: { type: 'Cross Street', poi: { name: 'A1202 / A1211' } },
        ...overrides,
    }) as Feature<Point>;

const collection = (features: unknown[]) => ({ type: 'FeatureCollection', features });

describe('validatePlaces', () => {
    it('accepts a canonical Point feature with poi.name and an enum type', () => {
        const result = validatePlaces(collection([makePlace()]));
        expect('value' in result).toBe(true);
    });

    it('rejects a non-FeatureCollection envelope', () => {
        const result = validatePlaces({ features: [] });
        expect(result).toEqual({ error: expect.stringContaining('must be a `Places` FeatureCollection') });
    });

    it('rejects a non-Point geometry (e.g. an incident LineString copied verbatim)', () => {
        const line = makePlace({
            geometry: {
                type: 'LineString',
                coordinates: [
                    [4.9, 52.4],
                    [4.91, 52.41],
                ],
            },
        });
        const result = validatePlaces(collection([line]));
        expect(result).toEqual({ error: expect.stringContaining('places[0]') });
    });

    it('rejects out-of-range / non-finite coordinates', () => {
        expect(
            validatePlaces(collection([makePlace({ geometry: { type: 'Point', coordinates: [200, 52.4] } })])),
        ).toEqual({ error: expect.stringContaining('places[0]') });
        expect(
            validatePlaces(collection([makePlace({ geometry: { type: 'Point', coordinates: [4.9, Number.NaN] } })])),
        ).toEqual({ error: expect.stringContaining('places[0]') });
    });

    it('rejects a place whose name lives under a non-canonical key (the original bug)', () => {
        // Sandbox wrote a flat `properties.name` — neither poi.name nor address.freeformAddress.
        const flat = makePlace({ properties: { type: 'Cross Street', name: 'A1202 / A1211' } });
        const result = validatePlaces(collection([flat]));
        expect(result).toEqual({ error: expect.stringContaining('display name') });
    });

    it('accepts a non-POI whose name lives in address.freeformAddress (schema path for intersections)', () => {
        const crossStreet = makePlace({
            properties: { type: 'Cross Street', address: { freeformAddress: 'A1202 & Commercial St' } },
        });
        expect('value' in validatePlaces(collection([crossStreet]))).toBe(true);
    });

    it('rejects a missing or non-enum type', () => {
        const noType = makePlace({ properties: { poi: { name: 'A1202 / A1211' } } });
        expect(validatePlaces(collection([noType]))).toEqual({
            error: expect.stringContaining('places[0].properties.type'),
        });
        const badType = makePlace({ properties: { type: 'Intersection', poi: { name: 'A1202 / A1211' } } });
        expect(validatePlaces(collection([badType]))).toEqual({
            error: expect.stringContaining('places[0].properties.type'),
        });
    });

    it('pinpoints the offending index in a multi-feature collection', () => {
        const bad = makePlace({ properties: { type: 'Cross Street', poi: { name: '' } } });
        const result = validatePlaces(collection([makePlace(), bad]));
        expect(result).toEqual({ error: expect.stringContaining('places[1]') });
    });

    it('mints a deterministic id from coordinates AND output index when the place is id-less', () => {
        const result = validatePlaces(collection([makePlace()]));
        if (!('value' in result)) throw new Error('expected a valid result');
        expect(result.value.features[0].id).toBe('derived-4.900000_52.400000-0');
    });

    it('gives the same collection the same ids (stable handle across identical runs)', () => {
        const a = validatePlaces(collection([makePlace()]));
        const b = validatePlaces(collection([makePlace()]));
        if (!('value' in a) || !('value' in b)) throw new Error('expected valid results');
        expect(a.value.features[0].id).toBe(b.value.features[0].id);
    });

    it('gives two id-less places at the same point distinct ids (index disambiguates)', () => {
        // Same coords AND same name — coords or names alone would collide; the output index does not.
        const result = validatePlaces(collection([makePlace(), makePlace()]));
        if (!('value' in result)) throw new Error('expected a valid result');
        expect(result.value.features[0].id).not.toBe(result.value.features[1].id);
    });

    it('preserves a real id the sandbox carried over (never overwrites)', () => {
        const result = validatePlaces(collection([makePlace({ id: 'TTI-abc-123' })]));
        if (!('value' in result)) throw new Error('expected a valid result');
        expect(result.value.features[0].id).toBe('TTI-abc-123');
    });

    it('rejects model-authored duplicate explicit ids (the mint guard never sees these)', () => {
        const result = validatePlaces(
            collection([makePlace({ id: 'same-id' }), makePlace({ id: 'same-id' })]),
        );
        expect(result).toEqual({
            error: expect.stringContaining('places[1]') && expect.stringContaining('duplicates id "same-id"'),
        });
    });
});
