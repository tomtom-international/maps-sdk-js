import { bboxFromGeoJSON, type PolygonFeature, type PolygonFeatures } from '@tomtom-org/maps-sdk/core';
import type { Position } from 'geojson';
import type { ColorPaletteOptions } from './layers/geometryLayers';
import type { GeometriesModuleConfig } from './types/geometriesModuleConfig';

/**
 * Visual theme for reachable range polygon display with {@link GeometriesModule}.
 *
 * - `filled`   — Colored fills with a center label on each ring
 * - `outline`  — Transparent fill with colored borders and a center label
 * - `inverted` — Colors the **unreachable** zone using donut geometry (requires {@link buildReachableRangeFeatures})
 *
 * @group Geometries
 */
export type ReachableRangeTheme = 'filled' | 'outline' | 'inverted';
export const reachableRangeThemes = ['filled', 'outline', 'inverted'] as const;

// Large bounding box in counterclockwise orientation (GeoJSON right-hand rule for exterior rings).
// Used as the outer boundary of donut polygons in the 'inverted' theme.
const WORLD_RING: Position[] = [
    [-180, -85],
    [-180, 85],
    [180, 85],
    [180, -85],
    [-180, -85],
];

// Returns the northernmost point of a polygon ring, used to anchor donut labels near the boundary.
const northPoint = (ring: Position[]): [number, number] =>
    ring.reduce((best, p) => (p[1] > best[1] ? p : best), ring[0]) as [number, number];

// Transforms range polygons into donut polygons for the 'inverted' theme.
// Each donut fills the zone between two consecutive budget boundaries.
const buildDonutFeatures = (features: PolygonFeature[]): PolygonFeature[] => {
    const donuts: PolygonFeature[] = features.map((feature, i) => {
        const outerRing: Position[] = i === 0 ? WORLD_RING : (features[i - 1].geometry.coordinates[0] as Position[]);
        const holeRing: Position[] = [...(feature.geometry.coordinates[0] as Position[])].reverse();
        return {
            ...feature,
            geometry: { type: 'Polygon', coordinates: [outerRing, holeRing] },
            properties: {
                ...feature.properties,
                placeCoordinates: northPoint(feature.geometry.coordinates[0] as Position[]),
            },
        } as PolygonFeature;
    });

    return [...donuts, ...features.slice(-1)];
};

/**
 * Returns a {@link GeometriesModuleConfig} for reachable ranges.
 *
 * Creates a config that adapts styling based on the `theme` property of each feature,
 * allowing a single module instance to display multiple themes.
 *
 * @param palette Color palette. Defaults to `'fadedRainbow'`.
 *
 * @example
 * ```typescript
 * // Create one module instance
 * const module = await GeometriesModule.get(map, reachableRangeLayerConfig());
 * ```
 *
 * @group Geometries
 */
export const reachableRangeLayerConfig = (palette: ColorPaletteOptions = 'fadedRainbow'): GeometriesModuleConfig => {
    return {
        beforeLayerConfig: 'lowestLabel',
        lineConfig: {
            // Outline theme: thick line, filled/inverted: thin line
            lineWidth: ['case', ['==', ['get', 'theme'], 'outline'], 5, 1],
            lineColor: ['case', ['==', ['get', 'theme'], 'outline'], ['coalesce', ['get', 'color'], '#555555'], 'grey'],
            lineOpacity: ['case', ['==', ['get', 'theme'], 'outline'], 0.9, 1],
        },
        colorConfig: {
            fillColor: palette,
            // Outline theme: transparent, filled/inverted: semi-transparent
            fillOpacity: ['case', ['==', ['get', 'theme'], 'outline'], 0, 0.6],
        },
        lineLabelConfig: {},
    };
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
    theme: ReachableRangeTheme = 'filled',
): PolygonFeature[] => {
    const labelled = features.map((f, i) => ({
        ...f,
        properties: { ...f.properties, title: labels[i], theme },
    }));
    return theme === 'inverted' ? buildDonutFeatures(labelled) : labelled;
};

/**
 * Prepares reachable range polygons for display with {@link GeometriesModule}.
 *
 * Transforms polygon features from `calculateReachableRange` into a {@link PolygonFeatures} collection
 * with labels and theme-specific geometry applied.
 *
 * Features must be ordered **largest budget first** (e.g. 30 min, 20 min, 10 min).
 *
 * @param features Polygon features from `calculateReachableRange`, ordered largest budget first.
 * @param labels   Label per feature in matching order (e.g. `['30 min', '20 min', '10 min']`).
 * @param theme    Visual theme. Defaults to `'filled'`.
 *
 * @example
 * ```typescript
 * const features = await calculateReachableRanges([...]);
 * const displayRanges = prepareReachableRangesForDisplay(
 *     features,
 *     ['30 min', '20 min', '10 min'],
 *     'inverted'
 * );
 *
 * const module = await GeometriesModule.get(map, reachableRangeLayerConfig('inverted'));
 * module.show(displayRanges);
 * ```
 *
 * @group Geometries
 */
export const prepareReachableRangesForDisplay = (
    features: PolygonFeature[],
    labels: string[],
    theme: ReachableRangeTheme = 'filled',
): PolygonFeatures => {
    const displayFeatures = buildReachableRangeFeatures(features, labels, theme);
    const bbox = bboxFromGeoJSON(features);

    return {
        type: 'FeatureCollection',
        ...(bbox && { bbox }),
        features: displayFeatures,
    };
};
