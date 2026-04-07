import type { AreaAnalyticsMetricKey } from '@tomtom-org/maps-sdk/core';
import type { BeforeLayerConfig, MapModuleCommonConfig } from '../../shared';

/**
 * A single stop in an analytics color ramp.
 *
 * How `value` is interpreted depends on the surrounding `AreaAnalyticsColorStopsConfig.valueType`.
 * `color` is any valid CSS color string.
 *
 * @group Traffic Area Analytics
 */
export type AreaAnalyticsColorStop = { value: number; color: string };

/**
 * Visualization mode for area analytics data.
 *
 * - `'hexgrid-3d'` — 3D extruded hexagonal cells colored and raised by metric value
 * - `'hexgrid-2d'` — Flat hexagonal cells colored by metric value (no extrusion)
 * - `'square-3d'` — 3D extruded square cells colored and raised by metric value
 * - `'square-2d'` — Flat square cells colored by metric value (no extrusion)
 * - `'heatmap'` — MapLibre density heatmap layer from tile centre points
 *
 * @group Traffic Area Analytics
 */
export type AreaAnalyticsDisplayMode = 'heatmap' | 'hexgrid-3d' | 'hexgrid-2d' | 'square-3d' | 'square-2d';

/**
 * Preset color theme for area analytics visualization.
 *
 * - `'trafficLight'` — Green → amber → red (default, traffic-signal style)
 * - `'heat'` — Blue → orange → red (heat-map style)
 * - `'monochrome'` — Light grey → dark grey (print-friendly)
 * - `'viridis'` — Purple → blue → green → yellow (perceptually uniform, colorblind-safe)
 * - `'plasma'` — Purple → magenta → orange → yellow (vivid, perceptually uniform)
 *
 * @group Traffic Area Analytics
 */
export type AreaAnalyticsColorTheme = 'trafficLight' | 'heat' | 'monochrome' | 'viridis' | 'plasma';

/**
 * Determines how numeric `value` fields in color stops are interpreted.
 *
 * - `'raw'` — stop values are actual metric values used directly
 *   (e.g. congestion: 0–100, speed: 0–120 km/h, travelTime: 0–20 s/km).
 * - `'relativeToPredefinedRangePCT'` — stop values are 0–100 percentages relative to the SDK's predefined
 *   metric ranges (congestion 0–100, speed 0–120 km/h, travelTime 0–20 s/km).
 *   Useful for consistent coloring regardless of the current dataset.
 * - `'relativeToActualRangePCT'` — stop values are 0–100 percentages relative to the live data
 *   range actually present in the loaded tiles (0 % = loaded minimum, 100 % = loaded maximum).
 *   Useful for maximum contrast when exact values are unknown.
 *
 * Defaults to `'raw'`.
 *
 * @group Traffic Area Analytics
 */
export type AreaAnalyticsValueType = 'raw' | 'relativeToPredefinedRangePCT' | 'relativeToActualRangePCT';

/**
 * Custom color stops configuration with an explicit value-type hint.
 *
 * @example
 * ```typescript
 * // Stops whose values are actual congestion-level values (0–100)
 * const color: AreaAnalyticsColorStopsConfig = {
 *   valueType: 'raw',
 *   stops: [
 *     { value: 0,   color: '#2dc653' },
 *     { value: 30,  color: '#f5a623' },
 *     { value: 100, color: '#e03030' },
 *   ],
 * };
 *
 * // Stops as 0–100 % of the predefined metric range (speed: 0–120 km/h)
 * const color: AreaAnalyticsColorStopsConfig = {
 *   valueType: 'relativeToPredefinedRangePCT',
 *   stops: [
 *     { value: 0,   color: '#e03030' },  // 0 km/h
 *     { value: 50,  color: '#f5a623' },  // 60 km/h
 *     { value: 100, color: '#2dc653' },  // 120 km/h
 *   ],
 * };
 *
 * // Stops as 0–100 % of the live data range (maximum contrast regardless of absolute values)
 * const color: AreaAnalyticsColorStopsConfig = {
 *   valueType: 'relativeToActualRangePCT',
 *   stops: [
 *     { value: 0,   color: '#2dc653' },  // 0% = loaded minimum
 *     { value: 50,  color: '#f5a623' },  // 50% = mid
 *     { value: 100, color: '#e03030' },  // 100% = loaded maximum
 *   ],
 * };
 * ```
 *
 * @group Traffic Area Analytics
 */
export type AreaAnalyticsColorStopsConfig = {
    /**
     * How stop values are interpreted. Defaults to `'raw'`.
     */
    valueType?: AreaAnalyticsValueType;

    /**
     * The color stops array.
     */
    stops: AreaAnalyticsColorStop[];
};

/**
 * Filter for visible tiles based on a metric's value range.
 * Both `min` and `max` are optional; at least one should be provided to have effect.
 *
 * @group Traffic Area Analytics
 */
export type AreaAnalyticsMetricFilter = {
    /** Show only tiles where the metric is ≥ this value. */
    min?: number;
    /** Show only tiles where the metric is ≤ this value. */
    max?: number;
};

/**
 * Height (extrusion) configuration for a metric.
 *
 * The shape depends on `scaleMode`:
 * - `'predefinedRange'` / `'currentRange'` (default): use `maxHeightMeters` to set a true visual ceiling.
 * - `'raw'`: use `scaleFactor` to multiply the raw metric value directly.
 *
 * @group Traffic Area Analytics
 */
export type AreaAnalyticsHeightConfig =
    | {
          /**
           * Normalised scale mode. The metric is mapped to a known range before computing height,
           * so `maxHeightMeters` equals the actual maximum visual height in meters.
           *
           * @defaultValue 'predefinedRange'
           */
          scaleMode?: 'predefinedRange' | 'currentRange';

          /**
           * True visual maximum extrusion height in meters.
           * The tallest cell reaches exactly this height.
           *
           * @defaultValue 1000
           */
          maxHeightMeters?: number;

          /**
           * Minimum extrusion height in meters.
           *
           * @defaultValue 0
           */
          minHeightMeters?: number;
      }
    | {
          /** Raw scale mode: `scaleFactor` is multiplied directly with the raw metric value. */
          scaleMode: 'raw';

          /**
           * Multiplier applied to the raw metric value to obtain extrusion height in meters.
           *
           * @defaultValue 1
           */
          scaleFactor?: number;

          /**
           * Minimum extrusion height in meters.
           *
           * @defaultValue 0
           */
          minHeightMeters?: number;
      };

/**
 * Per-metric visualization configuration.
 *
 * @group Traffic Area Analytics
 */
export type AreaAnalyticsMetricConfig = {
    /**
     * Color for this metric's visualization.
     *
     * Pass a preset theme name (`AreaAnalyticsColorTheme`) or a custom
     * `AreaAnalyticsColorStopsConfig` object with explicit stop values and a
     * value-type hint. For `speed`, the color order is automatically inverted
     * so that slow speeds render as "bad" (red) and fast speeds as "good" (green).
     *
     * @defaultValue `'trafficLight'` theme
     */
    color?: AreaAnalyticsColorTheme | AreaAnalyticsColorStopsConfig;

    /**
     * Extrusion height configuration for this metric.
     */
    height?: AreaAnalyticsHeightConfig;

    /**
     * Filter visible tiles to only those within the given value range for this metric.
     */
    filters?: AreaAnalyticsMetricFilter;
};

/**
 * Per-layer-type positioning configuration for area analytics layers.
 *
 * Controls where each analytics layer type sits in the map's layer stack independently.
 * Each property accepts `'top'` (above all layers) or a well-known style layer ID.
 * Omitted properties fall back to their default positions.
 *
 * @example
 * ```typescript
 * // Move all layers below the lowest label
 * const config: TrafficAreaAnalyticsConfig = {
 *   beforeLayerConfig: {
 *     heatmap: 'lowestLabel',
 *     hexgrid: { flat2D: 'lowestLabel', extrusion3D: 'lowestPlaceLabel' },
 *     square:  { flat2D: 'lowestLabel', extrusion3D: 'lowestPlaceLabel' },
 *   },
 * };
 *
 * // Only reposition the heatmap layer
 * const config: TrafficAreaAnalyticsConfig = {
 *   beforeLayerConfig: { heatmap: 'top' },
 * };
 * ```
 *
 * @group Traffic Area Analytics
 */
export type AreaAnalyticsBeforeLayerConfig = {
    /** Layer position for the heatmap layer. Defaults to `'lowestLabel'`. */
    heatmap?: BeforeLayerConfig;
    hexgrid?: {
        /** Layer position for the flat hexgrid fill layer. Defaults to `'lowestLabel'`. */
        flat2D?: BeforeLayerConfig;
        /** Layer position for the extruded hexgrid layer. Defaults to `'lowestPlaceLabel'`. */
        extrusion3D?: BeforeLayerConfig;
    };
    square?: {
        /** Layer position for the flat square fill layer. Defaults to `'lowestLabel'`. */
        flat2D?: BeforeLayerConfig;
        /** Layer position for the extruded square layer. Defaults to `'lowestPlaceLabel'`. */
        extrusion3D?: BeforeLayerConfig;
    };
};

/**
 * Display configuration for the actual region boundary geometry.
 *
 * When area analytics data is shown, the original region polygon (the area
 * the query was run for) is also rendered.  Use this config to control its
 * appearance.
 *
 * @group Traffic Area Analytics
 */
export type AreaAnalyticsRegionPolygonConfig = {
    /**
     * Color used for both the fill and outline of the region boundary.
     *
     * @defaultValue '#000000'
     */
    color?: string;

    /**
     * Opacity of the region fill.
     *
     * @defaultValue 0
     */
    fillOpacity?: number;

    /**
     * Opacity of the region outline.
     *
     * @defaultValue 0.5
     */
    outlineOpacity?: number;

    /**
     * Width of the region outline in pixels.
     *
     * @defaultValue 2
     */
    outlineWidth?: number;

    /**
     * When `true`, renders the region as an overlay covering everything *outside* the polygon
     * boundary, effectively tinting the area outside the analytics region.
     *
     * Uses a world-minus-polygon donut geometry (same technique as the `GeometriesModule`
     * `'inverted'` theme).
     *
     * @defaultValue false
     */
    inverted?: boolean;
};

// ── Default values ───────────────────────────────────────────────────

/**
 * Default values for all {@link TrafficAreaAnalyticsConfig} options.
 *
 * Use these as a reference for what the module applies when a property is omitted,
 * or spread them as a base when constructing a config programmatically.
 *
 * @group Traffic Area Analytics
 */
export const AREA_ANALYTICS_DEFAULTS = {
    /** @see {@link TrafficAreaAnalyticsConfig.visible} */
    visible: true,
    /** @see {@link TrafficAreaAnalyticsConfig.displayMode} */
    displayMode: 'hexgrid-3d',
    /** @see {@link TrafficAreaAnalyticsConfig.activeMetric} */
    activeMetric: 'congestionLevel',
    /** @see {@link TrafficAreaAnalyticsConfig.metricConfig} */
    metricConfig: {
        congestionLevel: {
            color: {
                valueType: 'raw',
                stops: [
                    { value: 0, color: '#2dc653' }, // free flow — green
                    { value: 50, color: '#f5a623' }, // moderate  — amber
                    { value: 100, color: '#e03030' }, // severe    — red
                ],
            },
            height: { maxHeightMeters: 1000, minHeightMeters: 0, scaleMode: 'predefinedRange' },
        },
        speed: {
            color: {
                valueType: 'relativeToPredefinedRangePCT',
                stops: [
                    { value: 0, color: '#e03030' }, // slow — red
                    { value: 50, color: '#f5a623' }, // medium — amber
                    { value: 100, color: '#2dc653' }, // fast  — green
                ],
            },
            height: { maxHeightMeters: 1000, minHeightMeters: 0, scaleMode: 'predefinedRange' },
        },
        travelTime: {
            color: {
                valueType: 'relativeToPredefinedRangePCT',
                stops: [
                    { value: 0, color: '#2dc653' }, // fast travel — green
                    { value: 50, color: '#f5a623' }, // moderate   — amber
                    { value: 100, color: '#e03030' }, // slow travel — red
                ],
            },
            height: { maxHeightMeters: 1000, minHeightMeters: 0, scaleMode: 'predefinedRange' },
        },
        freeFlowSpeed: {
            color: {
                valueType: 'relativeToPredefinedRangePCT',
                stops: [
                    { value: 0, color: '#e03030' }, // slow — red
                    { value: 50, color: '#f5a623' }, // medium — amber
                    { value: 100, color: '#2dc653' }, // fast  — green
                ],
            },
            height: { maxHeightMeters: 1000, minHeightMeters: 0, scaleMode: 'predefinedRange' },
        },
        // networkLength is the total road length within each tile — per-tile values vary widely
        // and are unpredictable, so relativeToActualRangePCT is used as the default to ensure
        // the visualization always scales to the live data range.
        networkLength: {
            color: {
                valueType: 'relativeToActualRangePCT',
                stops: [
                    { value: 0, color: '#2dc653' }, // low coverage  — green
                    { value: 50, color: '#f5a623' }, // mid coverage  — amber
                    { value: 100, color: '#e03030' }, // high coverage — red
                ],
            },
            height: { maxHeightMeters: 1000, minHeightMeters: 0, scaleMode: 'currentRange' },
        },
    },
    /** @see {@link AreaAnalyticsRegionPolygonConfig} */
    regionPolygon: {
        color: '#000000',
        fillOpacity: 0,
        outlineOpacity: 0.5,
        outlineWidth: 2,
        inverted: false,
    },
} satisfies TrafficAreaAnalyticsConfig;

// ── Main config type ────────────────────────────────────────────────

/**
 * Configuration for the Traffic Area Analytics visualization module.
 *
 * @remarks
 * The active metric is set via `activeMetric` (defaults to `'congestionLevel'`).
 * Per-metric style settings (color, height, filters) are nested under `metricConfig` keyed by
 * `AreaAnalyticsMetricKey`, making it easy to pre-configure multiple metrics independently and switch
 * between them at runtime via `setMetric()`.
 *
 * @example
 * ```typescript
 * const config: TrafficAreaAnalyticsConfig = {
 *   displayMode: 'hexgrid-3d',
 *   activeMetric: 'congestionLevel',
 *   metricConfig: {
 *     congestionLevel: {
 *       color: 'heat',
 *       height: { maxHeightMeters: 80, scaleMode: 'predefinedRange' },
 *       filters: { min: 10 },
 *     },
 *     speed: {
 *       color: {
 *         valueType: 'raw',
 *         stops: [
 *           { value: 0,   color: '#e03030' },
 *           { value: 60,  color: '#f5a623' },
 *           { value: 120, color: '#2dc653' },
 *         ],
 *       },
 *     },
 *   },
 * };
 * ```
 *
 * @group Traffic Area Analytics
 */
export type TrafficAreaAnalyticsConfig = MapModuleCommonConfig & {
    /**
     * Controls the visibility of the area analytics layers.
     *
     * @defaultValue true
     */
    visible?: boolean;

    /**
     * Visualization mode.
     *
     * @defaultValue 'hexgrid-3d'
     */
    displayMode?: AreaAnalyticsDisplayMode;

    /**
     * The metric that drives color and extrusion height.
     *
     * @defaultValue 'congestionLevel'
     */
    activeMetric?: AreaAnalyticsMetricKey;

    /**
     * Per-metric visualization configuration (color, height, filters).
     *
     * Metrics not listed here fall back to defaults (congestion color theme, metric-dependent height scale).
     */
    metricConfig?: Partial<Record<AreaAnalyticsMetricKey, AreaAnalyticsMetricConfig>>;

    /**
     * Per-layer-type positioning — controls where each analytics layer type sits in the map layer stack.
     * Omitted layer types fall back to their default positions (`'lowestLabel'` for flat/heatmap, `'lowestPlaceLabel'` for extrusions).
     */
    beforeLayerConfig?: AreaAnalyticsBeforeLayerConfig;

    /**
     * Display options for the region polygon boundary drawn alongside the analytics data.
     */
    regionPolygon?: AreaAnalyticsRegionPolygonConfig;
};
