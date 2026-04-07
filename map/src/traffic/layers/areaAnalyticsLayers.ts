import type { AreaAnalyticsMetricKey } from '@tomtom-org/maps-sdk/core';
import type {
    ExpressionSpecification,
    FillExtrusionLayerSpecification,
    FillLayerSpecification,
    HeatmapLayerSpecification,
    LineLayerSpecification,
} from 'maplibre-gl';
import type { BeforeLayerConfig, ToBeAddedLayerSpecWithoutSource } from '../../shared';
import { mapStyleLayerIDs } from '../../shared';
import { isClickEventState } from '../../shared/layers/eventState';
import type {
    AreaAnalyticsColorStop,
    AreaAnalyticsColorStopsConfig,
    AreaAnalyticsColorTheme,
    AreaAnalyticsHeightConfig,
    AreaAnalyticsRegionPolygonConfig,
    TrafficAreaAnalyticsConfig,
} from '../types/trafficAreaAnalyticsConfig';
import { AREA_ANALYTICS_DEFAULTS } from '../types/trafficAreaAnalyticsConfig';

// ── Internal types ───────────────────────────────────────────────────

/**
 * @ignore
 */
export type MetricRange = { min: number; max: number };

// ── Colour theme presets ─────────────────────────────────────────────

/**
 * @ignore
 */
export const COLOR_THEMES: Record<AreaAnalyticsColorTheme, string[]> = {
    trafficLight: ['#2dc653', '#f5a623', '#e03030'],
    heat: ['#2196F3', '#FF9800', '#F44336'],
    monochrome: ['#e0e0e0', '#888888', '#1a1a1a'],
    viridis: ['#fde725', '#35b779', '#31688e', '#440154'],
    plasma: ['#f0f921', '#ed7953', '#9c179e', '#0d0887'],
};

// ── Metric ranges used for colour / height interpolation ─────────────

// Per-tile networkLength values vary widely (they represent road coverage within one tile, not a region
// total), so the predefined range is a loose upper bound used only as a fallback before data loads.
// The networkLength default config uses relativeToActualRangePCT to normalize to the live data range.
const DEFAULT_METRIC_RANGES: Record<AreaAnalyticsMetricKey, MetricRange> = {
    congestionLevel: { min: 0, max: 100 },
    speed: { min: 0, max: 120 },
    travelTime: { min: 0, max: 20 },
    freeFlowSpeed: { min: 0, max: 120 },
    networkLength: { min: 0, max: 5_000 },
};

// Speed-related metrics are "higher = better", so preset color themes are applied in reverse.
const isSpeedMetric = (metric: AreaAnalyticsMetricKey): boolean => metric === 'speed' || metric === 'freeFlowSpeed';

// ── Config resolution helpers ────────────────────────────────────────

/** @ignore */
export const getActiveMetric = (config?: TrafficAreaAnalyticsConfig): AreaAnalyticsMetricKey => {
    return config?.activeMetric ?? AREA_ANALYTICS_DEFAULTS.activeMetric;
};

// Distributes an array of colors into evenly-spaced 0–1 normalized stops.
const distributeColors = (colors: string[]): AreaAnalyticsColorStop[] =>
    colors.map((color, i) => ({ value: colors.length === 1 ? 0 : i / (colors.length - 1), color }));

/**
 * Resolves the effective color stops for a given color configuration.
 * @ignore
 */
export const resolveColorStops = (
    colorConfig: AreaAnalyticsColorTheme | AreaAnalyticsColorStopsConfig,
): AreaAnalyticsColorStop[] => {
    if (typeof colorConfig === 'string') return distributeColors(COLOR_THEMES[colorConfig]);
    return colorConfig.stops;
};

const resolveBeforeID = (beforeLayerConfig?: BeforeLayerConfig): string | undefined => {
    if (beforeLayerConfig === 'top') return undefined;
    if (beforeLayerConfig) return mapStyleLayerIDs[beforeLayerConfig];
    return mapStyleLayerIDs.lowestLabel;
};

const resolveExtrusionBeforeID = (beforeLayerConfig?: BeforeLayerConfig): string | undefined => {
    if (beforeLayerConfig === 'top') return undefined;
    if (beforeLayerConfig) return mapStyleLayerIDs[beforeLayerConfig];
    return mapStyleLayerIDs.lowestPlaceLabel;
};

// ── Color / height expression builders ──────────────────────────────

// Builds a MapLibre interpolation expression mapping a metric property to a color scale.
const buildColorExpression = (
    metric: AreaAnalyticsMetricKey,
    colorConfig?: AreaAnalyticsColorTheme | AreaAnalyticsColorStopsConfig,
    computedRange?: MetricRange,
): ExpressionSpecification => {
    const effectiveConfig = colorConfig ?? AREA_ANALYTICS_DEFAULTS.metricConfig[metric].color ?? 'trafficLight';
    const stops = resolveColorStops(effectiveConfig);

    let scaled: Array<readonly [number, string]>;

    if (typeof effectiveConfig === 'string') {
        // Preset theme: stops have 0-1 normalized values → scale to metric range.
        // Speed-related metrics are inverted (higher = better), so reverse only the colors —
        // values must remain ascending to satisfy MapLibre's interpolate expression requirement.
        const { min, max } = DEFAULT_METRIC_RANGES[metric];
        const colors = isSpeedMetric(metric) ? [...stops].reverse().map((s) => s.color) : stops.map((s) => s.color);
        scaled = stops.map(({ value }, i) => [min + value * (max - min), colors[i]] as const);
    } else if (effectiveConfig.valueType === 'relativeToPredefinedRangePCT') {
        // 0-100 values relative to predefined metric range
        const { min, max } = DEFAULT_METRIC_RANGES[metric];
        scaled = stops.map(({ value, color }) => [min + (value / 100) * (max - min), color] as const);
    } else if (effectiveConfig.valueType === 'relativeToActualRangePCT') {
        // 0-100 values relative to live data range: 0% = loaded min, 100% = loaded max
        const { min, max } = computedRange ?? DEFAULT_METRIC_RANGES[metric];
        scaled = stops.map(({ value, color }) => [min + (value / 100) * (max - min), color] as const);
    } else {
        // 'raw': stop values are actual data values, used directly
        scaled = stops.map(({ value, color }) => [value, color] as const);
    }

    return ['interpolate', ['linear'], ['get', metric], ...scaled.flatMap(([val, color]) => [val, color])];
};

// Builds a MapLibre heatmap-color expression using the given color config.
const buildHeatmapColorExpression = (
    metric: AreaAnalyticsMetricKey,
    colorConfig?: AreaAnalyticsColorTheme | AreaAnalyticsColorStopsConfig,
): ExpressionSpecification => {
    const effectiveConfig = colorConfig ?? AREA_ANALYTICS_DEFAULTS.metricConfig[metric].color ?? 'trafficLight';
    const stops = resolveColorStops(effectiveConfig);
    // Map stop values (0-1 for presets; normalize for custom) to density range [0.3, 1.0]
    let densityStops: (number | string)[];

    if (typeof effectiveConfig === 'string') {
        // Preset: 0-1 normalized values map directly to density range.
        // Speed-related metrics are inverted (higher = better), so reverse only the colors —
        // values must remain ascending to satisfy MapLibre's interpolate expression requirement.
        const colors = isSpeedMetric(metric) ? [...stops].reverse().map((s) => s.color) : stops.map((s) => s.color);
        densityStops = stops.flatMap(({ value }, i) => [0.3 + value * 0.7, colors[i]]);
    } else if (
        effectiveConfig.valueType === 'relativeToPredefinedRangePCT' ||
        effectiveConfig.valueType === 'relativeToActualRangePCT'
    ) {
        // Both PCT types: 0-100 → normalize to 0-1 then map to density range [0.3, 1.0]
        densityStops = stops.flatMap(({ value, color }) => [0.3 + (value / 100) * 0.7, color]);
    } else {
        // 'raw': cannot easily normalize without data range for heatmap — treat as 0-1 normalized
        // (heatmap density is always 0-1; the first and last stop values anchor the range)
        const minValue = Math.min(...stops.map((s) => s.value));
        const maxValue = Math.max(...stops.map((s) => s.value));
        const range = maxValue - minValue || 1;
        densityStops = stops.flatMap(({ value, color }) => [0.3 + ((value - minValue) / range) * 0.7, color]);
    }

    return ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(0,0,0,0)', ...densityStops];
};

// Builds a MapLibre expression for fill-extrusion height driven by the active metric.
const buildHeightExpression = (
    metric: AreaAnalyticsMetricKey,
    heightConfig?: AreaAnalyticsHeightConfig,
    computedRange?: MetricRange,
): ExpressionSpecification => {
    const defaultHeight = AREA_ANALYTICS_DEFAULTS.metricConfig[metric].height;
    const minHeight = heightConfig?.minHeightMeters ?? defaultHeight.minHeightMeters ?? 0;

    if (heightConfig?.scaleMode === 'raw') {
        const scaleFactor = heightConfig.scaleFactor ?? 1;
        if (metric === 'speed') {
            const { max } = DEFAULT_METRIC_RANGES[metric];
            return ['max', minHeight, ['*', ['-', max, ['coalesce', ['get', 'speed'], 0]], scaleFactor]];
        }
        return ['max', minHeight, ['*', ['coalesce', ['get', metric], 0], scaleFactor]];
    }

    // 'predefinedRange' or 'currentRange' (default)
    const maxHeight = heightConfig?.maxHeightMeters ?? defaultHeight.maxHeightMeters ?? 1000;
    const scaleMode = heightConfig?.scaleMode ?? defaultHeight.scaleMode;
    const { min, max } =
        scaleMode === 'currentRange' ? (computedRange ?? DEFAULT_METRIC_RANGES[metric]) : DEFAULT_METRIC_RANGES[metric];
    const range = max - min || 1;

    if (metric === 'speed') {
        return ['max', minHeight, ['*', ['/', ['-', max, ['coalesce', ['get', 'speed'], 0]], range], maxHeight]];
    }
    return ['max', minHeight, ['*', ['/', ['-', ['coalesce', ['get', metric], 0], min], range], maxHeight]];
};

// ── Heatmap layer builder ────────────────────────────────────────────

// Expands a preset theme name into per-metric explicit raw stops with correct display ordering.
// Speed-like metrics are inverted so "slow" always maps to the bad end of the ramp.
// Used by the module when a theme is applied globally across all metrics.
export const expandThemeToAllMetrics = (
    theme: AreaAnalyticsColorTheme,
): Partial<Record<AreaAnalyticsMetricKey, { color: AreaAnalyticsColorStopsConfig }>> => {
    const rawStops = resolveColorStops(theme);
    const toMetricStops = (metric: AreaAnalyticsMetricKey): AreaAnalyticsColorStopsConfig => {
        const { min, max } = DEFAULT_METRIC_RANGES[metric];
        const colors = isSpeedMetric(metric)
            ? [...rawStops].reverse().map((s) => s.color)
            : rawStops.map((s) => s.color);
        return {
            valueType: 'raw',
            stops: rawStops.map(({ value }, i) => ({ value: min + value * (max - min), color: colors[i] })),
        };
    };
    return {
        congestionLevel: { color: toMetricStops('congestionLevel') },
        speed: { color: toMetricStops('speed') },
        travelTime: { color: toMetricStops('travelTime') },
        freeFlowSpeed: { color: toMetricStops('freeFlowSpeed') },
        networkLength: { color: toMetricStops('networkLength') },
    };
};

/**
 * Builds the heatmap layer spec for a given source and config.
 * @ignore
 */
export const buildHeatmapLayerSpec = (
    layerId: string,
    config?: TrafficAreaAnalyticsConfig,
    computedRange?: MetricRange,
): ToBeAddedLayerSpecWithoutSource<HeatmapLayerSpecification> => {
    const metric = getActiveMetric(config);
    const metricConfig = config?.metricConfig?.[metric];
    const { min, max } = computedRange ?? DEFAULT_METRIC_RANGES[metric];

    return {
        id: layerId,
        type: 'heatmap',
        beforeID: resolveBeforeID(config?.beforeLayerConfig?.heatmap),
        paint: {
            'heatmap-weight': ['interpolate', ['linear'], ['get', metric], min, 0, max, 1],
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 10, 0.5, 14, 2, 16, 4],
            'heatmap-color': buildHeatmapColorExpression(metric, metricConfig?.color),
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 4, 1, 8, 3, 12, 35, 14, 80, 16, 100],
            'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 4, 0.8, 13, 0.8, 17, 0],
        },
    };
};

// ── Hexgrid layer builders ───────────────────────────────────────────

/**
 * Builds the flat hex fill layer spec.
 * @ignore
 */
export const buildHexFillLayerSpec = (
    layerId: string,
    config?: TrafficAreaAnalyticsConfig,
    computedRange?: MetricRange,
): ToBeAddedLayerSpecWithoutSource<FillLayerSpecification> => {
    const metric = getActiveMetric(config);
    const metricConfig = config?.metricConfig?.[metric];

    return {
        id: layerId,
        type: 'fill',
        beforeID: resolveBeforeID(config?.beforeLayerConfig?.hexgrid?.flat2D),
        paint: {
            'fill-color': buildColorExpression(metric, metricConfig?.color, computedRange),
            'fill-opacity': 0.6,
        },
    };
};

/**
 * Builds the extruded hex layer spec.
 * @ignore
 */
export const buildHexExtrusionLayerSpec = (
    layerId: string,
    config?: TrafficAreaAnalyticsConfig,
    computedRange?: MetricRange,
): ToBeAddedLayerSpecWithoutSource<FillExtrusionLayerSpecification> => {
    const metric = getActiveMetric(config);
    const metricConfig = config?.metricConfig?.[metric];

    return {
        id: layerId,
        type: 'fill-extrusion',
        beforeID: resolveExtrusionBeforeID(config?.beforeLayerConfig?.hexgrid?.extrusion3D),
        paint: {
            'fill-extrusion-color': buildColorExpression(metric, metricConfig?.color, computedRange),
            'fill-extrusion-height': buildHeightExpression(metric, metricConfig?.height, computedRange),
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.75,
        },
    };
};

// ── Square grid layer builders ───────────────────────────────────────

/**
 * Builds the flat square fill layer spec.
 * @ignore
 */
export const buildSquareFillLayerSpec = (
    layerId: string,
    config?: TrafficAreaAnalyticsConfig,
    computedRange?: MetricRange,
): ToBeAddedLayerSpecWithoutSource<FillLayerSpecification> => {
    const metric = getActiveMetric(config);
    const metricConfig = config?.metricConfig?.[metric];

    return {
        id: layerId,
        type: 'fill',
        beforeID: resolveBeforeID(config?.beforeLayerConfig?.square?.flat2D),
        paint: {
            'fill-color': buildColorExpression(metric, metricConfig?.color, computedRange),
            'fill-opacity': 0.6,
        },
    };
};

/**
 * Builds the extruded square layer spec.
 * @ignore
 */
export const buildSquareExtrusionLayerSpec = (
    layerId: string,
    config?: TrafficAreaAnalyticsConfig,
    computedRange?: MetricRange,
): ToBeAddedLayerSpecWithoutSource<FillExtrusionLayerSpecification> => {
    const metric = getActiveMetric(config);
    const metricConfig = config?.metricConfig?.[metric];

    return {
        id: layerId,
        type: 'fill-extrusion',
        beforeID: resolveExtrusionBeforeID(config?.beforeLayerConfig?.square?.extrusion3D),
        paint: {
            'fill-extrusion-color': buildColorExpression(metric, metricConfig?.color, computedRange),
            'fill-extrusion-height': buildHeightExpression(metric, metricConfig?.height, computedRange),
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.75,
        },
    };
};

// ── Region boundary layer builders ───────────────────────────────────

// Resolves the region display config with defaults applied.
const resolveRegionConfig = (region?: AreaAnalyticsRegionPolygonConfig) => ({
    ...AREA_ANALYTICS_DEFAULTS.regionPolygon,
    ...region,
});

/**
 * Builds the region boundary fill layer spec.
 * @ignore
 */
export const buildRegionFillLayerSpec = (
    layerId: string,
    config?: TrafficAreaAnalyticsConfig,
): ToBeAddedLayerSpecWithoutSource<FillLayerSpecification> => {
    const { color, fillOpacity } = resolveRegionConfig(config?.regionPolygon);

    return {
        id: layerId,
        type: 'fill',
        beforeID: resolveBeforeID(),
        paint: {
            'fill-color': color,
            'fill-opacity': fillOpacity,
        },
    };
};

/**
 * Builds the region boundary outline layer spec.
 * @ignore
 */
export const buildRegionLineLayerSpec = (
    layerId: string,
    config?: TrafficAreaAnalyticsConfig,
): ToBeAddedLayerSpecWithoutSource<LineLayerSpecification> => {
    const { color, outlineOpacity, outlineWidth } = resolveRegionConfig(config?.regionPolygon);

    return {
        id: layerId,
        type: 'line',
        beforeID: resolveBeforeID(),
        paint: {
            'line-color': color,
            'line-opacity': outlineOpacity,
            'line-width': outlineWidth,
        },
    };
};

// ── Event-state highlight layer builders ──────────────────────────────
//
// These layers render only when a feature has an `eventState` property set
// (written automatically by the EventsProxy on hover / click). They provide
// visual feedback on top of the main data layers without modifying them.

// Shared: white polygon footprint outline on hover / click.
const buildPolygonOutlineLayerSpec = (
    layerId: string,
    beforeID: string | undefined,
): ToBeAddedLayerSpecWithoutSource<LineLayerSpecification> => ({
    id: layerId,
    type: 'line',
    beforeID,
    filter: ['has', 'eventState'],
    paint: {
        'line-color': '#ffffff',
        'line-width': ['case', isClickEventState, 3, 2],
        'line-opacity': ['case', isClickEventState, 1, 0.8],
    },
});

/**
 * White outline at the hex cell footprint on hover / click (2D mode).
 * @ignore
 */
export const buildHexOutlineLayerSpec = (
    layerId: string,
    config?: TrafficAreaAnalyticsConfig,
): ToBeAddedLayerSpecWithoutSource<LineLayerSpecification> =>
    buildPolygonOutlineLayerSpec(layerId, resolveBeforeID(config?.beforeLayerConfig?.hexgrid?.flat2D));

/**
 * White outline at the square cell footprint on hover / click (2D mode).
 * @ignore
 */
export const buildSquareOutlineLayerSpec = (
    layerId: string,
    config?: TrafficAreaAnalyticsConfig,
): ToBeAddedLayerSpecWithoutSource<LineLayerSpecification> =>
    buildPolygonOutlineLayerSpec(layerId, resolveBeforeID(config?.beforeLayerConfig?.square?.flat2D));

// Shared: derives a white semi-transparent fill-extrusion highlight from the given base data layer spec.
// Inherits beforeID and fill-extrusion-base; raises height by 0.5 m to prevent z-fighting.
// Raises height by 0.5 m so the highlight prism clears the data layer in the depth buffer.
// Fill-extrusion uses a strict depth test: same-height overlays are discarded entirely.
const buildExtrusionHighlightLayerSpec = (
    base: ToBeAddedLayerSpecWithoutSource<FillExtrusionLayerSpecification>,
): ToBeAddedLayerSpecWithoutSource<FillExtrusionLayerSpecification> => ({
    ...base,
    filter: ['has', 'eventState'],
    paint: {
        ...base.paint,
        // fill-extrusion-opacity is not data-driven — use a constant and vary the color instead.
        'fill-extrusion-color': ['case', isClickEventState, '#ffffff', '#ffffff'],
        'fill-extrusion-height': ['+', base.paint?.['fill-extrusion-height'] as ExpressionSpecification, 0.5],
        'fill-extrusion-opacity': 0.6,
    },
});

/**
 * Semi-transparent white fill-extrusion overlay on hover / click in 3D hex mode.
 * Highlights all visible faces of the extruded prism, approximating a "mesh" highlight effect.
 * @ignore
 */
export const buildHexExtrusionHighlightLayerSpec = (
    layerId: string,
    config?: TrafficAreaAnalyticsConfig,
    computedRange?: MetricRange,
): ToBeAddedLayerSpecWithoutSource<FillExtrusionLayerSpecification> =>
    buildExtrusionHighlightLayerSpec(buildHexExtrusionLayerSpec(layerId, config, computedRange));

/**
 * Semi-transparent white fill-extrusion overlay on hover / click in 3D square mode.
 * Highlights all visible faces of the extruded prism, approximating a "mesh" highlight effect.
 * @ignore
 */
export const buildSquareExtrusionHighlightLayerSpec = (
    layerId: string,
    config?: TrafficAreaAnalyticsConfig,
    computedRange?: MetricRange,
): ToBeAddedLayerSpecWithoutSource<FillExtrusionLayerSpecification> =>
    buildExtrusionHighlightLayerSpec(buildSquareExtrusionLayerSpec(layerId, config, computedRange));
