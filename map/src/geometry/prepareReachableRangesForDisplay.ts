import { type PolygonFeature, type PolygonFeatures } from '@tomtom-org/maps-sdk/core';
import { difference, featureCollection, mask } from '@turf/turf';
import type { GeometryTheme } from './types/geometryTheme';

/** Custom label generator for reachable range features. */
export type ReachableRangeLabelFn = (feature: PolygonFeature, index: number) => string;

/** Unit suffix for each budget type, used for auto-generated labels. */
const BUDGET_UNITS: Readonly<Record<string, string>> = {
    timeMinutes: 'min',
    distanceKM: 'km',
    remainingChargeCPT: '% remaining',
    spentChargePCT: '% spent',
    spentFuelLiters: 'L',
};

/**
 * Transforms range polygons into donut polygons for the 'inverted' theme.
 * Each donut fills the zone between two consecutive budget boundaries.
 */
const buildDonutFeatures = (features: PolygonFeature[]): PolygonFeature[] => {
    const donuts: PolygonFeature[] = features.map((feature, i) => {
        // Outermost band: world minus the largest range polygon.
        // Inner bands: previous (larger) range minus current (smaller) range.
        const donutGeo = i === 0 ? mask(feature) : difference(featureCollection([features[i - 1], feature]));
        return {
            ...feature,
            geometry: (donutGeo ?? feature).geometry,
        } as PolygonFeature;
    });

    return [...donuts, ...features.slice(-1)];
};

/**
 * Attaches labels and applies theme-specific geometry to reachable range polygon features.
 *
 * Features must be ordered **largest budget first** (e.g. 30 min, 20 min, 10 min).
 * For the `inverted` theme, polygons are converted to donuts and one extra innermost feature is appended.
 *
 * @param features Polygon features from `calculateReachableRange`, ordered largest budget first.
 * @param labels   Label per feature in matching order (e.g. `['30 min', '20 min', '10 min']`).
 * @param theme    Visual theme. Defaults to `'filled'`.
 *
 * @example
 * ```typescript
 * const features = [range30min, range20min, range10min];
 * const labels   = ['30 min', '20 min', '10 min'];
 *
 * module.show({
 *     type: 'FeatureCollection',
 *     features: buildReachableRangeFeatures(features, labels, 'inverted'),
 * });
 * ```
 *
 * @group Geometries
 */
export const buildReachableRangeFeatures = (
    features: PolygonFeature[],
    labels: string[],
    theme: GeometryTheme = 'filled',
): PolygonFeature[] => {
    const labelled = features.map((f, i) => ({
        ...f,
        properties: { ...f.properties, title: labels[i], theme },
    }));
    if (theme === 'inverted') {
        // buildDonutFeatures handles its own geometry transformation for multi-range donuts.
        // Set theme to 'filled' afterward to prevent prepareGeometryForDisplay from
        // applying invertFeature on already-transformed geometry.
        return buildDonutFeatures(labelled).map((f) => ({
            ...f,
            properties: { ...f.properties, theme: 'filled' as GeometryTheme },
        }));
    }
    return labelled;
};

/**
 * Prepares the output of `calculateReachableRanges` for display with {@link GeometriesModule}.
 *
 * Derives labels from each feature's `budget` property by default, applies theme-specific
 * geometry, and preserves the bounding box. Pass the returned value directly to `module.show()`.
 *
 * Note: when using {@link reachableRangeGeometryConfig} this is called automatically — you only
 * need this function for explicit control over labels or theme.
 *
 * Features must be ordered **largest budget first** (e.g. 30 min, 20 min, 10 min).
 *
 * @param result Raw output of `calculateReachableRanges`.
 * @param theme Visual theme. Defaults to `'filled'`.
 * @param label Custom label generator; when omitted, labels derived from `budget` property.
 *
 * @example
 * ```typescript
 * // explicit control:
 * module.show(prepareReachableRangesForDisplay(result, 'inverted'));
 * module.show(prepareReachableRangesForDisplay(result, 'filled', (f) => myLabel(f)));
 * ```
 *
 * @group Geometries
 */
export const prepareReachableRangesForDisplay = (
    result: PolygonFeatures,
    theme: GeometryTheme = 'filled',
    label?: ReachableRangeLabelFn,
): PolygonFeatures => {
    const features = result.features as PolygonFeature[];
    const labels = features.map((f, i) => {
        if (label) {
            return label(f, i);
        }
        const budget = f.properties?.['budget'] as { type?: string; value?: number } | undefined;
        if (budget?.value !== undefined && budget?.type) {
            return `${budget.value} ${BUDGET_UNITS[budget.type] ?? budget.type}`;
        }
        return String(i + 1);
    });

    return {
        type: 'FeatureCollection',
        ...(result.bbox && { bbox: result.bbox }),
        features: buildReachableRangeFeatures(features, labels, theme),
    };
};
