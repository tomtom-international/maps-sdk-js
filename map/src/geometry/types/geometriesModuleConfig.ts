import type { PolygonFeatures } from '@tomtom-org/maps-sdk/core';
import type { DataDrivenPropertyValueSpecification, LineLayerSpecification } from 'maplibre-gl';
import type { BeforeLayerConfig, MapModuleCommonConfig, ToBeAddedLayerSpecTemplate } from '../../shared';
import type { ColorPaletteOptions } from '../layers/colorPalettes';
import type { GeometryTheme } from './geometryTheme';

/**
 * Fill configuration for geometry styling — the interior color, opacity, and (optionally) where the
 * fill layer sits in the map's layer stack.
 *
 * @example
 * ```typescript
 * // Solid color with opacity
 * const fill: GeometryFillConfig = { color: '#FF5733', opacity: 0.3 };
 *
 * // Palette name
 * const fill: GeometryFillConfig = { color: 'red', opacity: 0.25 };
 *
 * // Data-driven color based on properties
 * const fill: GeometryFillConfig = {
 *   color: ['match', ['get', 'type'], 'residential', '#FFEB3B', 'commercial', '#2196F3', '#E0E0E0'],
 *   opacity: 0.4,
 * };
 * ```
 *
 * @group Geometries
 */
export type GeometryFillConfig = {
    /**
     * Fill color: a hex string (`'#FF5733'`), a palette name (`'red'`), or a MapLibre expression
     * for data-driven styling (e.g. `['get', 'color']`).
     *
     * @default '#0A3653'
     */
    color?: ColorPaletteOptions | DataDrivenPropertyValueSpecification<string>;

    /**
     * Fill opacity, 0 (transparent) to 1 (opaque). Also accepts a MapLibre expression.
     *
     * @default 0.15
     */
    opacity?: DataDrivenPropertyValueSpecification<number>;

    /**
     * Layer positioning for the **fill** layer only.
     *
     * @remarks
     * Overrides the top-level {@link GeometriesModuleConfig.beforeLayerConfig} for the fill.
     * Use this to sink the fill below the road network while the border stays above, e.g.
     * `fill: { beforeLayerConfig: 'lowestRoadLine' }`, `line: { beforeLayerConfig: 'top' }`.
     */
    beforeLayerConfig?: BeforeLayerConfig;
};

/**
 * Text label configuration for geometries.
 *
 * Controls text labels displayed at the center of polygon geometries.
 *
 * @example
 * ```typescript
 * // Simple text field
 * const textConfig: GeometryTextConfig = {
 *   textField: ['get', 'name']
 * };
 *
 * // Conditional text
 * const conditionalText: GeometryTextConfig = {
 *   textField: ['case', ['has', 'title'], ['get', 'title'], ['get', 'id']]
 * };
 * ```
 *
 * @group Geometries
 */
export type GeometryTextConfig = {
    /**
     * Text content to display as label.
     *
     * @remarks
     * Must be a MapLibre expression that evaluates to a string.
     * Labels are positioned at the geometry's center point.
     *
     * @example
     * ```typescript
     * // Display feature property
     * textField: ['get', 'name']
     *
     * // Concatenate properties
     * textField: ['concat', ['get', 'name'], ' (', ['get', 'area'], ' km²)']
     *
     * // Conditional text
     * textField: ['case', ['has', 'label'], ['get', 'label'], '']
     * ```
     */
    textField: DataDrivenPropertyValueSpecification<string>;
};

/**
 * Line/border configuration for geometries — the outline color, opacity, width, an escape hatch for
 * any other line property, and (optionally) where the border layer sits in the map's layer stack.
 *
 * @remarks
 * The curated `color` / `opacity` / `width` fields cover the common cases; the {@link
 * GeometryLineConfig.layer | `layer`} escape hatch accepts a partial MapLibre `LineLayerSpecification`
 * for anything else (`line-gap-width`, `line-cap`, `line-join`, …). The curated fields take precedence
 * over the same `paint` property set via `layer`.
 *
 * @example
 * ```typescript
 * // Curated fields
 * const line: GeometryLineConfig = { color: '#333333', width: 2, opacity: 0.8 };
 *
 * // Data-driven border
 * const line: GeometryLineConfig = {
 *   color: ['get', 'borderColor'],
 *   width: ['case', ['get', 'selected'], 4, 2],
 * };
 * ```
 *
 * @group Geometries
 */
export type GeometryLineConfig = {
    /**
     * Border/outline color: a hex string or a MapLibre expression (e.g. `['get', 'borderColor']`).
     *
     * @default '#0A3653'
     */
    color?: DataDrivenPropertyValueSpecification<string>;

    /**
     * Border opacity, 0 (transparent) to 1 (opaque). Also accepts a MapLibre expression.
     *
     * @default 1
     */
    opacity?: DataDrivenPropertyValueSpecification<number>;

    /**
     * Border width in pixels. Also accepts a MapLibre expression
     * (e.g. `['case', ['get', 'selected'], 4, 2]`).
     *
     * @default 2
     */
    width?: DataDrivenPropertyValueSpecification<number>;

    /**
     * Escape hatch for full control over the border (outline) line layer.
     *
     * @remarks
     * Accepts a partial MapLibre `LineLayerSpecification` (without `id`/`source`) that is merged
     * onto the outline layer: top-level fields first, then `layout` and `paint` are merged per
     * property so base defaults survive. Use this to set any line property the curated fields above
     * don't cover (e.g. `line-gap-width`, `line-cap`, `line-join`, `line-pattern`).
     *
     * The curated fields (`color`, `opacity`, `width`) **take precedence** over the same `paint`
     * properties set here.
     *
     * @example
     * ```typescript
     * line: {
     *     color: '#00A65E',
     *     layer: { paint: { 'line-gap-width': 3 }, layout: { 'line-cap': 'round' } },
     * }
     * ```
     */
    layer?: Partial<ToBeAddedLayerSpecTemplate<LineLayerSpecification>>;

    /**
     * Layer positioning for the **border/outline** layer only.
     *
     * @remarks
     * Overrides the top-level {@link GeometriesModuleConfig.beforeLayerConfig} for the border.
     * Pair with {@link GeometryFillConfig.beforeLayerConfig} to split the fill and border across
     * the layer stack (e.g. fill below roads, border on top).
     */
    beforeLayerConfig?: BeforeLayerConfig;
};

/**
 * Line label configuration for geometries.
 *
 * When set, a symbol layer is added to the geometry source,
 * placing labels along the polygon border lines
 *
 * @example
 * ```typescript
 * // Defaults
 * const lineLabelConfig: GeometryLineLabelConfig = {};
 *
 * // Custom appearance for dark fills
 * const lineLabelConfig: GeometryLineLabelConfig = {
 *   minZoom: 10,
 *   textColor: '#FFFFFF',
 *   textHaloColor: '#000000',
 *   textSize: 13
 * };
 * ```
 *
 * @group Geometries
 */
export type GeometryLineLabelConfig = {
    /**
     * Minimum zoom level at which border labels are visible.
     *
     * @default 3
     */
    minZoom?: number;

    /**
     * Font size of the border labels in pixels.
     *
     * @default 15
     *
     * @example
     * ```typescript
     * textSize: 13
     * // Data-driven
     * textSize: ['interpolate', ['linear'], ['zoom'], 8, 12, 14, 16]
     * ```
     */
    textSize?: DataDrivenPropertyValueSpecification<number>;

    /**
     * Color of the border label text.
     *
     * @default '#333333'
     *
     * @example
     * ```typescript
     * textColor: '#FFFFFF'
     * textColor: ['get', 'labelColor']
     * ```
     */
    textColor?: DataDrivenPropertyValueSpecification<string>;

    /**
     * Color of the halo drawn around the border label text.
     *
     * The halo improves legibility against complex or dark backgrounds.
     *
     * @default '#FFFFFF'
     *
     * @example
     * ```typescript
     * textHaloColor: '#000000'
     * ```
     */
    textHaloColor?: DataDrivenPropertyValueSpecification<string>;

    /**
     * Width of the halo drawn around the border label text, in pixels.
     *
     * @default 2
     *
     * @example
     * ```typescript
     * textHaloWidth: 3
     * ```
     */
    textHaloWidth?: DataDrivenPropertyValueSpecification<number>;

    /**
     * Distance between repeated labels along the border line, in pixels.
     *
     * @default 200
     *
     * @example
     * ```typescript
     * symbolSpacing: 350
     * ```
     */
    symbolSpacing?: number;

    /**
     * Opacity of the border label text.
     *
     * @default 1
     *
     * @example
     * ```typescript
     * textOpacity: 0.8
     * ```
     */
    textOpacity?: DataDrivenPropertyValueSpecification<number>;

    /**
     * Offset of the border label from the line, in ems `[x, y]`.
     *
     * @default [0, 1]
     *
     * @example
     * ```typescript
     * textOffset: [0, 1]  // Default: 1em above the line
     * ```
     */
    textOffset?: DataDrivenPropertyValueSpecification<[number, number]>;
};

/**
 * Layer positioning configuration for geometries.
 *
 * Controls where geometry layers are placed in the map's layer stack.
 *
 * @remarks
 * Use this to ensure geometries appear above or below other map features like
 * labels, roads, or other data layers.
 *
 * @remarks
 * A single {@link BeforeLayerConfig} (`'top'` or a layer id) positions **all** geometry layers
 * together. The object form positions the fill and border independently — `all` is the fallback
 * for any target it doesn't name.
 *
 * @example
 * ```typescript
 * // Place all geometry layers on top
 * const beforeLayer: GeometryBeforeLayerConfig = 'top';
 *
 * // Place all below labels
 * const beforeLayer: GeometryBeforeLayerConfig = 'lowestLabel';
 *
 * // Fill below the road network, border on top
 * const beforeLayer: GeometryBeforeLayerConfig = { fill: 'lowestRoadLine', line: 'top' };
 * ```
 *
 * @group Geometries
 */
export type GeometryBeforeLayerConfig = BeforeLayerConfig | GeometryBeforeLayerTargets;

/**
 * Per-layer positioning targets for the object form of {@link GeometryBeforeLayerConfig}.
 *
 * `fill` and `line` position their respective layers; `all` is the fallback applied to any
 * target not explicitly set. A per-layer `beforeLayerConfig` inside {@link GeometryFillConfig}
 * or {@link GeometryLineConfig} wins over the value here.
 *
 * @group Geometries
 */
export type GeometryBeforeLayerTargets = {
    /** Fallback position for any layer not named by `fill` / `line`. */
    all?: BeforeLayerConfig;
    /** Position for the fill layer. */
    fill?: BeforeLayerConfig;
    /** Position for the border/outline layer (and its line labels). */
    line?: BeforeLayerConfig;
};

/**
 * Configuration options for the GeometriesModule.
 *
 * Controls the visual appearance and positioning of polygon geometries displayed on the map.
 *
 * @example
 * ```typescript
 * // Basic styling
 * const config: GeometriesModuleConfig = {
 *   fill: { color: '#FF5733', opacity: 0.3 },
 *   line: { color: '#C70039', width: 2 },
 * };
 *
 * // With labels and positioning
 * const advancedConfig: GeometriesModuleConfig = {
 *   fill: { color: 'blue', opacity: 0.25 },
 *   line: { color: 'darkblue', width: 3 },
 *   textConfig: {
 *     textField: ['get', 'name']
 *   },
 *   beforeLayerConfig: 'lowestLabel'  // Below map labels
 * };
 *
 * // Data-driven styling
 * const dynamicConfig: GeometriesModuleConfig = {
 *   fill: {
 *     color: ['match', ['get', 'category'], 'park', '#4CAF50', 'water', '#2196F3', '#9E9E9E'],
 *     opacity: 0.4
 *   },
 *   line: {
 *     color: '#000000', width: ['case', ['get', 'highlighted'], 4, 2],
 *   },
 *   textConfig: {
 *     textField: ['concat', ['get', 'name'], '\n', ['get', 'area'], ' km²']
 *   }
 * };
 * ```
 *
 * @group Geometries
 */
export type GeometriesModuleConfig = MapModuleCommonConfig & {
    /**
     * Fill color, opacity, and (optional) fill-layer positioning.
     *
     * Controls the interior color and transparency of polygon geometries.
     */
    fill?: GeometryFillConfig;

    /**
     * Text label configuration.
     *
     * Controls labels displayed at geometry center points.
     */
    textConfig?: GeometryTextConfig;

    /**
     * Border/outline configuration, and (optional) border-layer positioning.
     *
     * Controls the outline appearance of polygon geometries.
     */
    line?: GeometryLineConfig;

    /**
     * Layer positioning configuration.
     *
     * Controls where geometry layers appear in the map's layer stack.
     * Use `'top'` to place above all layers, or specify a layer ID to place
     * below that layer.
     *
     * @example
     * ```typescript
     * // On top of everything
     * beforeLayerConfig: 'top'
     *
     * // Below map labels
     * beforeLayerConfig: 'lowestLabel'
     *
     * // Below POI layer
     * beforeLayerConfig: 'POI'
     * ```
     */
    beforeLayerConfig?: GeometryBeforeLayerConfig;

    /**
     * Line label configuration.
     *
     * When set, labels are placed along the polygon border lines.
     */
    lineLabelConfig?: GeometryLineLabelConfig;

    /**
     * Visual theme applied to all features shown by this module.
     *
     * - `'filled'` — Colored fill with thin border (default)
     * - `'outline'` — Transparent fill with thick colored border
     * - `'inverted'` — Colors the area **outside** the polygon (donut geometry)
     *
     * Individual features can override this by setting `theme` in their properties.
     *
     * @example
     * ```typescript
     * // Show the "rest of the world" outside a country
     * const module = await GeometriesModule.get(map, {
     *     theme: 'inverted',
     *     fill: { color: 'black', opacity: 0.5 }
     * });
     * module.show(countryGeometry);
     * ```
     */
    theme?: GeometryTheme;

    /**
     * Transform applied to features before rendering.
     *
     * Receives the value passed to {@link GeometriesModule.show} and returns
     * features ready for display. Useful for deriving labels or other display
     * properties from domain data.
     *
     * @remarks
     * Used internally by {@link reachableRangeGeometryConfig} to generate budget
     * labels (e.g. `'30 min'`) from feature properties. For most use cases,
     * the standard config fields (`fill`, `textConfig`, `theme`) suffice.
     *
     * @example
     * ```typescript
     * // Derive title from a custom property
     * const config: GeometriesModuleConfig = {
     *     transformFeaturesForDisplay: (fc) => ({
     *         ...fc,
     *         features: fc.features.map((f) => ({
     *             ...f,
     *             properties: { ...f.properties, title: f.properties?.customLabel },
     *         })),
     *     }),
     * };
     * ```
     */
    transformFeaturesForDisplay?: (input: PolygonFeatures) => PolygonFeatures;
};
