import type { MapGeoJSONFeature } from 'maplibre-gl';
import { describe, expect, test } from 'vitest';
import { findFeatureByRefId, renderedRefId } from '../featureId';

const ref = (id?: string | number, propId?: string | number) =>
    ({ ...(id !== undefined && { id }), properties: propId === undefined ? {} : { id: propId } }) as MapGeoJSONFeature;

describe('renderedRefId', () => {
    test('prefers properties.id over the top-level id', () => {
        expect(renderedRefId(ref('top', 'prop'))).toBe('prop');
    });

    test("clustered sources: ignores MapLibre's synthetic top-level id, returns the real properties.id", () => {
        // Clustering drops promoteId, so MapLibre stamps a synthetic numeric top-level id (0, 1, …).
        expect(renderedRefId(ref(0, 'real-id'))).toBe('real-id');
    });

    test('falls back to the top-level id when properties.id is absent (e.g. vector-tile features)', () => {
        expect(renderedRefId(ref('top', undefined))).toBe('top');
    });

    test('returns undefined when neither is set', () => {
        expect(renderedRefId(ref())).toBeUndefined();
        expect(renderedRefId({ properties: null } as unknown as MapGeoJSONFeature)).toBeUndefined();
    });

    test('treats a 0 properties.id as present (not a fallback trigger)', () => {
        expect(renderedRefId(ref(undefined, 0))).toBe(0);
    });

    test('ignores a non-primitive properties.id, falling back to the top-level id', () => {
        expect(renderedRefId({ id: 'top', properties: { id: { nested: true } } } as unknown as MapGeoJSONFeature)).toBe(
            'top',
        );
    });

    test('returns undefined for a non-primitive properties.id with no top-level id', () => {
        expect(renderedRefId({ properties: { id: ['a'] } } as unknown as MapGeoJSONFeature)).toBeUndefined();
    });
});

describe('findFeatureByRefId', () => {
    const features = [ref('a'), ref(undefined, 'b'), ref('c'), ref('a')] as MapGeoJSONFeature[];

    test('finds by top-level id, returning the feature and its index', () => {
        expect(findFeatureByRefId(features, 'c')).toEqual({ feature: features[2], index: 2 });
    });

    test('finds by properties.id fallback', () => {
        expect(findFeatureByRefId(features, 'b')).toEqual({ feature: features[1], index: 1 });
    });

    test('returns the first occurrence on duplicate ids', () => {
        expect(findFeatureByRefId(features, 'a')).toEqual({ feature: features[0], index: 0 });
    });

    test('returns undefined for a missing id', () => {
        expect(findFeatureByRefId(features, 'z')).toBeUndefined();
    });

    test('returns undefined for a nullish target id', () => {
        expect(findFeatureByRefId(features, undefined)).toBeUndefined();
        expect(findFeatureByRefId(features, null as unknown as string)).toBeUndefined();
    });
});
