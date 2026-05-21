import type { FeatureCollection, GeometryCollection } from 'geojson';
import { describe, expect, test } from 'vitest';
import { defaultLayersFor } from '../layer-defaults';

// Minimal FeatureCollection builder. The helper only inspects `feature.geometry.type`, so any
// (lng,lat) coordinate is fine — the geometry's `type` is the only meaningful input.
const fc = (geometryTypes: readonly string[]): FeatureCollection => ({
    type: 'FeatureCollection',
    features: geometryTypes.map((type) => ({
        type: 'Feature',
        properties: {},
        // Any coordinate set is fine — the picker never reads `coordinates`. Cast through `any`
        // because the union narrows to a specific shape per geometry type and we don't care.
        geometry: { type, coordinates: [0, 0] } as never,
    })),
});

describe('defaultLayersFor', () => {
    test('picks a circle layer for point-only data', () => {
        const layers = defaultLayersFor(fc(['Point']));
        expect(layers.map((l) => l.type)).toEqual(['circle']);
    });

    test('picks a line layer for line-only data', () => {
        expect(defaultLayersFor(fc(['LineString'])).map((l) => l.type)).toEqual(['line']);
    });

    test('picks a fill layer for polygon-only data', () => {
        expect(defaultLayersFor(fc(['Polygon'])).map((l) => l.type)).toEqual(['fill']);
    });

    test('stacks fill → line → circle when all kinds are present', () => {
        // Stack order matters for legibility: areas at the bottom, points on top — this layering
        // contract is part of why integrators may want to override.
        const layers = defaultLayersFor(fc(['Polygon', 'LineString', 'Point']));
        expect(layers.map((l) => l.type)).toEqual(['fill', 'line', 'circle']);
    });

    test('input ordering does not influence stacking', () => {
        const a = defaultLayersFor(fc(['Point', 'Polygon', 'LineString']));
        const b = defaultLayersFor(fc(['Polygon', 'LineString', 'Point']));
        expect(a.map((l) => l.type)).toEqual(b.map((l) => l.type));
    });

    test('Multi* geometries collapse into their base kind', () => {
        expect(defaultLayersFor(fc(['MultiPoint'])).map((l) => l.type)).toEqual(['circle']);
        expect(defaultLayersFor(fc(['MultiLineString'])).map((l) => l.type)).toEqual(['line']);
        expect(defaultLayersFor(fc(['MultiPolygon'])).map((l) => l.type)).toEqual(['fill']);
    });

    test('GeometryCollection recurses into inner geometries', () => {
        const inner: GeometryCollection = {
            type: 'GeometryCollection',
            geometries: [
                { type: 'Point', coordinates: [0, 0] },
                {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [0, 0],
                            [1, 0],
                            [1, 1],
                            [0, 0],
                        ],
                    ],
                },
            ],
        };
        const data: FeatureCollection = {
            type: 'FeatureCollection',
            features: [{ type: 'Feature', properties: {}, geometry: inner }],
        };
        expect(defaultLayersFor(data).map((l) => l.type)).toEqual(['fill', 'circle']);
    });

    test('empty FeatureCollection falls back to a single circle layer', () => {
        // Even when nothing renders, CustomGeoJSONModule still needs at least one layer to bind
        // its source to — the fallback exists for that reason.
        expect(defaultLayersFor(fc([])).map((l) => l.type)).toEqual(['circle']);
    });

    test('features without geometry are skipped, not crashed on', () => {
        // Real-world GeoJSON allows `geometry: null` (e.g. address records with no point yet) —
        // strict typing of `FeatureCollection` forbids it, but the helper still needs to be safe.
        const data = {
            type: 'FeatureCollection',
            features: [{ type: 'Feature', properties: {}, geometry: null }],
        } as unknown as FeatureCollection;
        expect(defaultLayersFor(data).map((l) => l.type)).toEqual(['circle']);
    });

    test('unknown geometry types fall through to the circle fallback', () => {
        // We don't recognise the type, so no kind is registered and the fallback kicks in.
        expect(defaultLayersFor(fc(['SomethingMadeUp'])).map((l) => l.type)).toEqual(['circle']);
    });
});
