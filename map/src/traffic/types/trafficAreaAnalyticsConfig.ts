import type { BeforeLayerConfig, MapModuleCommonConfig } from '../../shared';

/**
 * Available metrics for area analytics visualization.
 *
 * @group Traffic Area Analytics
 */
export type AreaAnalyticsMetricKey = 'congestionLevel' | 'speed' | 'travelTime';

/**
 * A single stop in an analytics color ramp.
 *
 * `value` is a normalized 0–1 number representing a position within the active
 * metric's range (e.g. 0 = minimum, 1 = maximum for the given metric).
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
 * - `'tiles'` — Raw API tile centres rendered as square polygons with original per-tile metric values
 *
 * @group Traffic Area Analytics
 */
export type AreaAnalyticsMode = 'heatmap' | 'hexgrid-3d' | 'hexgrid-2d' | 'square-3d' | 'square-2d';

/**
 * Preset color theme for area analytics visualization.
 *
 * - `'congestion'` — Green → amber → red (default, traffic-signal style)
 * - `'thermal'` — Blue → orange → red (heat-map style)
 * - `'monochrome'` — Light grey → dark grey (print-friendly)
 *
 * @group Traffic Area Analytics
 */
export type AreaAnalyticsColorTheme = 'congestion' | 'thermal' | 'monochrome';

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
     * @defaultValue 0.05
     */
    fillOpacity?: number;

    /**
     * Opacity of the region outline.
     *
     * @defaultValue 0.8
     */
    outlineOpacity?: number;

    /**
     * Width of the region outline in pixels.
     *
     * @defaultValue 2
     */
    outlineWidth?: number;
};

// ── New config building blocks ──────────────────────────────────────

/**
 * Custom color configuration for area analytics layers.
 *
 * Provide either a named `preset` or custom three-stop `stops` gradient.
 * When both are specified, `stops` takes precedence.
 *
 * @group Traffic Area Analytics
 */
export type AreaAnalyticsColorConfig = {
    /**
     * Three-stop color gradient: `[low, mid, high]`. CSS color strings.
     *
     * @example `['#00ff00', '#ffff00', '#ff0000']`
     */
    stops?: [string, string, string];
    /**
     * Use a named preset instead of custom stops.
     */
    preset?: AreaAnalyticsColorScheme;
};

/**
 * Metric range used for color and height interpolation.
 *
 * @group Traffic Area Analytics
 */
export type MetricRange = { min: number; mid: number; max: number };

/**
 * Strategy for resolving metric ranges.
 *
 * - `'auto'` — scale to actual data (min/median/max from tile values)
 * - `'fixed'` — use hardcoded defaults (congestion: 0-100, speed: 0-120, travelTime: 0-20)
 * - `'union'` — use hardcoded range but expand when data exceeds it
 *
 * @group Traffic Area Analytics
 */
export type AreaAnalyticsRangeStrategy = 'auto' | 'fixed' | 'union';

/**
 * Range configuration for a metric.
 *
 * @group Traffic Area Analytics
 */
export type AreaAnalyticsRangeConfig = {
    /**
     * Explicit fixed range. Overrides strategy when set.
     */
    fixed?: MetricRange;
    /**
     * Strategy for resolving the range from data.
     *
     * @defaultValue 'union'
     */
    strategy?: AreaAnalyticsRangeStrategy;
};

/**
 * Height (extrusion) configuration for hexgrid and tile modes.
 *
 * @group Traffic Area Analytics
 */
export type AreaAnalyticsHeightConfig = {
    /**
     * Base multiplier for extrusion height.
     * Default is metric-dependent: congestion=50, speed=40, travelTime=200.
     */
    scale?: number;
    /**
     * Minimum extrusion height in meters.
     *
     * @defaultValue 10
     */
    minHeight?: number;
    /**
     * Disable 3D extrusion entirely — render flat polygons only.
     *
     * @defaultValue false
     */
    flat?: boolean;
};

/**
 * A filter condition on a single metric.
 *
 * @group Traffic Area Analytics
 */
export type AreaAnalyticsTileFilter = {
    /** Metric to filter on. */
    metric: AreaAnalyticsMetricKey;
    /** Show only tiles where metric ≥ this value. */
    min?: number;
    /** Show only tiles where metric ≤ this value. */
    max?: number;
};

/**
 * Tile filter configuration using OR logic.
 *
 * A tile is shown if it matches **any** of the filters in the `any` array.
 *
 * @group Traffic Area Analytics
 */
export type AreaAnalyticsFilters = {
    any: AreaAnalyticsTileFilter[];
};

/**
 * Tooltip configuration for the built-in hover popup.
 *
 * @remarks
 * When enabled, the module creates and manages a MapLibre Popup that
 * appears on hexgrid/tile hover. Developers who need custom tooltips
 * can disable this and use `module.events.on('hover', ...)` instead.
 *
 * @group Traffic Area Analytics
 */
export type AreaAnalyticsTooltipConfig = {
    /**
     * Enable the built-in hover tooltip.
     *
     * @defaultValue false
     */
    enabled: boolean;
    /**
     * Which metrics to display in the tooltip. Defaults to all available.
     */
    metrics?: AreaAnalyticsMetricKey[];
    /**
     * Custom HTML formatter. Receives feature properties, returns an HTML string.
     * When provided, overrides the default metric table.
     */
    formatter?: (properties: AreaAnalyticsDisplayProperties) => string;
};

// ── Main config type ────────────────────────────────────────────────

/**
 * Configuration for the Traffic Area Analytics visualization module.
 *
 * @remarks
 * Controls which visualization mode is active, which metric drives
 * the color/height, color theming, custom color stops, layer positioning,
 * and overall visibility.
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
    displayMode?: AreaAnalyticsMode;

    /**
     * The traffic metric that drives color and height.
     *
     * @defaultValue 'congestionLevel'
     */
    metric?: AreaAnalyticsMetricKey;

    /**
     * Color for the analytics layers. Either a preset theme name or per-metric custom color stops.
     *
     * When using custom stops, provide a partial record mapping each metric to its own color ramp.
     *
     * All metrics use the same color convention — `value: 0` gets the "good" color (green) and
     * `value: 1` gets the "bad" color (red). For `speed` the library automatically inverts the
     * mapping so that slow speeds render red and fast speeds render green.
     * Metrics absent from the record fall back to the default `'congestion'` preset.
     *
     * @example
     * ```typescript
     * // Preset theme for all metrics
     * color: 'thermal'
     *
     * // Custom stops per metric — breakpoints tuned for urban traffic
     * color: {
     *   congestionLevel: [
     *     { value: 0,    color: '#2dc653' },  // 0 %   — free flow
     *     { value: 0.3,  color: '#f5a623' },  // 30 %  — moderate congestion
     *     { value: 1,    color: '#e03030' },  // 100 % — severe congestion
     *   ],
     *   speed: [
     *     { value: 0,    color: '#2dc653' },  // 0 km/h   — auto-inverted → renders red
     *     { value: 0.33, color: '#f5a623' },  // ~40 km/h — urban speed threshold
     *     { value: 1,    color: '#e03030' },  // 120 km/h — auto-inverted → renders green
     *   ],
     *   travelTime: [
     *     { value: 0,   color: '#2dc653' },   // 0 s/km  — fast
     *     { value: 0.6, color: '#f5a623' },   // 12 s/km — moderate delay
     *     { value: 1,   color: '#e03030' },   // 20 s/km — heavy delay
     *   ],
     * }
     * ```
     */
    color?: AreaAnalyticsColorTheme | Partial<Record<AreaAnalyticsMetricKey, AreaAnalyticsColorStop[]>>;

    /**
     * Per-layer-type positioning — controls where each analytics layer type sits in the map layer stack.
     * Omitted layer types fall back to their default positions (`'lowestLabel'` for flat/heatmap, `'lowestPlaceLabel'` for extrusions).
     */
    beforeLayerConfig?: AreaAnalyticsBeforeLayerConfig;

    /**
     * Display options for the region polygon boundary drawn alongside the analytics data.
     */
    regionPolygon?: AreaAnalyticsRegionPolygonConfig;

    /**
     * Metric range configuration per metric. Controls color/height interpolation boundaries.
     *
     * @defaultValue union strategy (expand hardcoded range when data exceeds)
     */
    ranges?: Partial<Record<AreaAnalyticsMetricKey, AreaAnalyticsRangeConfig>>;

    /**
     * Height (extrusion) configuration for hexgrid and tile modes.
     */
    height?: AreaAnalyticsHeightConfig;

    /**
     * Tile filter — only show tiles matching metric thresholds.
     */
    filters?: AreaAnalyticsFilters;

    /**
     * Built-in hover tooltip configuration.
     *
     * @defaultValue disabled
     */
    tooltip?: AreaAnalyticsTooltipConfig;
};
