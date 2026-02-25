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
 * Splits each reachable-range polygon into two features for the inverted theme:
 * - Donut fill (no `theme` prop) — pre-inverted geometry via `mask`/`difference`; no border or label.
 * - Border polygon (`theme: 'filled'`) — original geometry; fill suppressed; carries border and line label.
 *
 * Separating fills and borders prevents the line-label layer from tracing inner donut holes.
 *
 * Donut fills intentionally have `theme` stripped. `prepareGeometryForDisplay` inverts any feature
 * whose resolved theme is `'inverted'` (`props.theme ?? config.theme`). Since donut geometry is already
 * pre-inverted via `mask`/`difference`, stripping `theme` prevents double inversion without the need of 
 * a flag or marker leaking into the user-facing API.
 */
const buildDonutFeatures = (features: PolygonFeature[]): PolygonFeature[] => {
    const donutFills = features.map((feature, i) => {
        const donutGeo = i === 0 ? mask(feature) : difference(featureCollection([features[i - 1], feature]));
        const { title: _title, theme: _theme, ...rest } = feature.properties ?? {};
        return { ...feature, geometry: donutGeo?.geometry ?? feature.geometry, properties: rest } as PolygonFeature;
    });

    const borderPolygons = features.map((feature) => ({
        ...feature,
        id: undefined,
        properties: { ...feature.properties, theme: 'filled' as GeometryTheme },
    })) as PolygonFeature[];

    return [...donutFills, ...borderPolygons];
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
        return buildDonutFeatures(labelled);
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
