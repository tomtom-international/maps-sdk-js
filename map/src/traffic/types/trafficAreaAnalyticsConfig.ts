import type { MapModuleCommonConfig } from '../../shared';
import type { AreaAnalyticsDisplayProperties } from './trafficAreaAnalyticsFeature';

/**
 * Available metrics for area analytics visualization.
 *
 * @group Traffic Area Analytics
 */
export type AreaAnalyticsMetricKey = 'congestionLevel' | 'speed' | 'travelTime';

/**
 * Visualization mode for area analytics data.
 *
 * - `'hexgrid'` — 3D extruded hexagonal cells colored and raised by metric value
 * - `'heatmap'` — MapLibre density heatmap layer from tile centre points
 * - `'tiles'` — Raw API tile centres rendered as square polygons with original per-tile metric values
 *
 * @group Traffic Area Analytics
 */
export type AreaAnalyticsMode = 'heatmap' | 'hexgrid' | 'tiles';

/**
 * Preset color scheme for area analytics visualization.
 *
 * - `'congestion'` — Green → amber → red (default, traffic-signal style)
 * - `'thermal'` — Blue → orange → red (heat-map style)
 * - `'monochrome'` — Light grey → dark grey (print-friendly)
 *
 * @group Traffic Area Analytics
 */
export type AreaAnalyticsColorScheme = 'congestion' | 'thermal' | 'monochrome';

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
 * the color/height, and overall layer visibility.
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
     * @defaultValue 'hexgrid'
     */
    mode?: AreaAnalyticsMode;

    /**
     * The traffic metric that drives color and height.
     *
     * @defaultValue 'congestionLevel'
     */
    metric?: AreaAnalyticsMetricKey;

    /**
     * Preset color scheme for the visualization layers.
     * Shorthand for `colors: { preset: ... }`.
     *
     * @defaultValue 'congestion'
     */
    colorScheme?: AreaAnalyticsColorScheme;

    /**
     * Custom color configuration. Overrides `colorScheme` when `stops` is set.
     */
    colors?: AreaAnalyticsColorConfig;

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
