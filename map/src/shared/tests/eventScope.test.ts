import type { LayerSpecification, MapGeoJSONFeature } from 'maplibre-gl';
import { describe, expect, test } from 'vitest';
import {
    assertNoReservedScopeNames,
    combineEventScopes,
    type ResolvedEventScope,
    reservedScopeNames,
    scopedLayerSpecs,
} from '../eventScope';
import type { SourceWithLayers } from '../types';

const layer = (id: string, type: LayerSpecification['type'] = 'symbol') =>
    ({ id, type, source: 'SOURCE_ID' }) as LayerSpecification;

const sourceWithLayers = (...layerSpecs: LayerSpecification[]) =>
    ({ source: { id: 'SOURCE_ID' }, _layerSpecs: layerSpecs }) as unknown as SourceWithLayers;

const feature = (magnitude: string) => ({ properties: { magnitude } }) as unknown as MapGeoJSONFeature;

describe('combineEventScopes', () => {
    test('returns undefined when neither side scopes anything', () => {
        expect(combineEventScopes(undefined, undefined)).toBeUndefined();
    });

    test('returns the defined side when only one is given', () => {
        const scope: ResolvedEventScope = { layerFilter: (layerSpec) => layerSpec.id === 'a' };

        expect(combineEventScopes(scope, undefined)).toBe(scope);
        expect(combineEventScopes(undefined, scope)).toBe(scope);
    });

    test('ANDs the layer filters of both sides', () => {
        const combined = combineEventScopes(
            { layerFilter: (layerSpec) => layerSpec.id.startsWith('road') },
            { layerFilter: (layerSpec) => layerSpec.id.endsWith('label') },
        );

        expect(combined?.layerFilter?.(layer('road-label'))).toBe(true);
        expect(combined?.layerFilter?.(layer('road-casing'))).toBe(false);
        expect(combined?.layerFilter?.(layer('water-label'))).toBe(false);
    });

    test('ANDs the feature predicates of both sides', () => {
        const combined = combineEventScopes(
            { featureMatches: (candidate) => candidate.properties.magnitude !== 'unknown' },
            { featureMatches: (candidate) => candidate.properties.magnitude !== 'minor' },
        );

        expect(combined?.featureMatches?.(feature('major'))).toBe(true);
        expect(combined?.featureMatches?.(feature('minor'))).toBe(false);
        expect(combined?.featureMatches?.(feature('unknown'))).toBe(false);
    });

    test('keeps the two axes independent when each side scopes a different one', () => {
        const combined = combineEventScopes(
            { layerFilter: (layerSpec) => layerSpec.id === 'incidents' },
            { featureMatches: (candidate) => candidate.properties.magnitude === 'major' },
        );

        expect(combined?.layerFilter?.(layer('incidents'))).toBe(true);
        expect(combined?.featureMatches?.(feature('major'))).toBe(true);
    });
});

describe('scopedLayerSpecs', () => {
    const source = sourceWithLayers(layer('roads'), layer('roadLabels'), layer('water'));

    test('returns every layer when there is no scope', () => {
        expect(scopedLayerSpecs(source, undefined).map((layerSpec) => layerSpec.id)).toEqual([
            'roads',
            'roadLabels',
            'water',
        ]);
    });

    test('returns every layer when the scope has no layer filter', () => {
        expect(scopedLayerSpecs(source, { featureMatches: () => true })).toHaveLength(3);
    });

    test('returns only the selected layers when the scope has a layer filter', () => {
        const scoped = scopedLayerSpecs(source, { layerFilter: (layerSpec) => layerSpec.id.startsWith('road') });

        expect(scoped.map((layerSpec) => layerSpec.id)).toEqual(['roads', 'roadLabels']);
    });
});

describe('assertNoReservedScopeNames', () => {
    test('accepts names that do not collide with the events methods', () => {
        expect(() => assertNoReservedScopeNames(['tunnels', 'waypoints'], 'RoutingModule')).not.toThrow();
    });

    test.each(reservedScopeNames)('rejects the reserved name "%s" and names it in the message', (reserved) => {
        expect(() => assertNoReservedScopeNames(['fine', reserved], 'CustomGeoJSONModule source')).toThrow(
            `CustomGeoJSONModule source uses the reserved event scope name "${reserved}".`,
        );
    });
});
