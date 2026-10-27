import * as turf from '@turf/turf';
import type { Feature, FeatureCollection, Geometry, MultiPolygon, Polygon } from 'geojson';

// Small turf primitives shared across the site tools, kept in one place so the clip call and the km²
// unit don't drift between them.

export type AreaGeometry = Polygon | MultiPolygon;
export type AreaFeature = Feature<AreaGeometry>;

// Intersect two polygonal features; null when they don't overlap or turf rejects the geometry.
export const clipPolygons = (a: AreaFeature, b: AreaFeature): AreaFeature | null => {
    try {
        const clipped = turf.intersect(turf.featureCollection([a, b]));
        return clipped ? (clipped as AreaFeature) : null;
    } catch {
        return null;
    }
};

// Union of polygonal features: the feature itself when there is one, null when there are none or turf
// rejects the geometry.
export const unionPolygons = (features: AreaFeature[]): AreaFeature | null => {
    if (features.length <= 1) return features[0] ?? null;
    try {
        return (turf.union(turf.featureCollection(features)) as AreaFeature | null) ?? null;
    } catch {
        return null;
    }
};

// Area in km², rounded to two decimals.
export const km2 = (geojson: Feature | FeatureCollection | Geometry): number =>
    Math.round((turf.area(geojson) / 1e6) * 100) / 100;
