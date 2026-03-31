import type {
    ExpressionSpecification,
    FillExtrusionLayerSpecification,
    FillLayerSpecification,
    HeatmapLayerSpecification,
    LineLayerSpecification,
} from 'maplibre-gl';
import type { BeforeLayerConfig, ToBeAddedLayerSpecWithoutSource } from '../../shared';
import { mapStyleLayerIDs } from '../../shared';
import type {
    AreaAnalyticsColorStop,
    AreaAnalyticsColorTheme,
    AreaAnalyticsMetricKey,
    AreaAnalyticsRegionPolygonConfig,
    MetricRange,
    TrafficAreaAnalyticsConfig,
} from '../types/trafficAreaAnalyticsConfig';

// ── Colour theme presets ─────────────────────────────────────────────

/**
 * @ignore
 */
export const COLOR_SCHEMES: Record<AreaAnalyticsColorTheme, AreaAnalyticsColorStop[]> = {
    congestion: [
        { value: 0, color: '#2dc653' },
        { value: 0.5, color: '#f5a623' },
        { value: 1, color: '#e03030' },
    ],
    thermal: [
        { value: 0, color: '#2196F3' },
        { value: 0.5, color: '#FF9800' },
        { value: 1, color: '#F44336' },
    ],
    monochrome: [
        { value: 0, color: '#e0e0e0' },
        { value: 0.5, color: '#888888' },
        { value: 1, color: '#1a1a1a' },
    ],
};

const DEFAULT_THEME: AreaAnalyticsColorTheme = 'congestion';

// ── Metric ranges used for colour / height interpolation ─────────────

/**
 * @ignore
 */
export const METRIC_RANGES: Record<AreaAnalyticsMetricKey, MetricRange> = {
    congestionLevel: { min: 0, mid: 50, max: 100 },
    speed: { min: 0, mid: 50, max: 120 },
    travelTime: { min: 0, mid: 10, max: 20 },
};

// ── Height multipliers per metric ────────────────────────────────────

/** @ignore */
export const DEFAULT_HEIGHT_SCALE: Record<AreaAnalyticsMetricKey, number> = {
    congestionLevel: 50,
    speed: 40,
    travelTime: 200,
};

// ── Config resolution helpers ────────────────────────────────────────

/**
 * Resolves the effective color stops for a given metric from a config.
 * Per-metric custom stops take precedence over a named `AreaAnalyticsColorTheme`.
 * Metrics absent from the custom record fall back to the default preset.
 * @ignore
 */
export const resolveColorStops = (
    metric: AreaAnalyticsMetricKey,
    config?: { color?: TrafficAreaAnalyticsConfig['color'] },
): AreaAnalyticsColorStop[] => {
    if (config?.color !== null && typeof config?.color === 'object') {
        const metricStops = (config.color as Partial<Record<AreaAnalyticsMetricKey, AreaAnalyticsColorStop[]>>)[metric];
        if (metricStops) return metricStops;
        return COLOR_SCHEMES[DEFAULT_THEME];
    }

    return COLOR_SCHEMES[(config?.color as AreaAnalyticsColorTheme | undefined) ?? DEFAULT_THEME];
};

/**
 * Resolves the `beforeID` string from a BeforeLayerConfig value.
 * Returns `undefined` for `'top'` (append after all layers). Defaults to `lowestLabel`.
 * @ignore
 */
export const resolveBeforeID = (beforeLayerConfig?: BeforeLayerConfig): string | undefined => {
    if (beforeLayerConfig === 'top') return undefined;
    if (beforeLayerConfig) return mapStyleLayerIDs[beforeLayerConfig];
    return mapStyleLayerIDs.lowestLabel;
};

/**
 * Resolves the `beforeID` for extrusion layers. Defaults to `lowestPlaceLabel`.
 * @ignore
 */
export const resolveExtrusionBeforeID = (beforeLayerConfig?: BeforeLayerConfig): string | undefined => {
    if (beforeLayerConfig === 'top') return undefined;
    if (beforeLayerConfig) return mapStyleLayerIDs[beforeLayerConfig];
    return mapStyleLayerIDs.lowestPlaceLabel;
};

// ── Color / height expression builders ──────────────────────────────

/**
 * Builds a MapLibre interpolation expression that maps a metric property
 * to a color scale from the resolved color stops.
 *
 * Stop values (0–1) are scaled to the metric's min–max range.
 * For `speed` the color order is inverted (high speed = low color, low speed = high color).
 * @ignore
 */
export const buildColorExpression = (
    metric: AreaAnalyticsMetricKey,
    config?: { color?: TrafficAreaAnalyticsConfig['color'] },
): ExpressionSpecification => {
    const { min, mid, max } = range ?? METRIC_RANGES[metric];
    const { low, mid: midColor, high } = colors;
    const stops = resolveColorStops(metric, config);

    // Scale normalized 0-1 values to the metric's actual range
    const scaled = stops.map(({ value, color }) => [min + value * (max - min), color] as const);

    const ordered =
        metric === 'speed'
            ? // Inverted: low value → last color, high value → first color
              scaled.map(([val], i) => [val, scaled[scaled.length - 1 - i][1]] as const)
            : scaled;

    return ['interpolate', ['linear'], ['get', metric], ...ordered.flatMap(([val, color]) => [val, color])];
};

/**
 * Builds a MapLibre `heatmap-color` expression using the given color stops.
 * @ignore
 */
export const buildHeatmapColorExpression = (
    metric: AreaAnalyticsMetricKey,
    config?: { color?: TrafficAreaAnalyticsConfig['color'] },
): ExpressionSpecification => {
    const stops = resolveColorStops(metric, config);
    // Map 0-1 stop values into density range [0.3, 1.0], leaving 0 → transparent
    const densityStops = stops.flatMap(({ value, color }) => [0.3 + value * 0.7, color]);
    return ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(0,0,0,0)', ...densityStops];
};

/**
 * Builds a MapLibre expression for fill-extrusion height driven by the active metric.
 * @ignore
 */
export const buildHeightExpression = (
    metric: AreaAnalyticsMetricKey,
    range?: MetricRange,
    heightConfig?: AreaAnalyticsHeightConfig,
): ExpressionSpecification => {
    if (heightConfig?.flat) {
        return ['literal', 0];
    }

    const scale = heightConfig?.scale ?? DEFAULT_HEIGHT_SCALE[metric];
    const minHeight = heightConfig?.minHeight ?? DEFAULT_MIN_HEIGHT;
    const { max } = range ?? METRIC_RANGES[metric];

    if (metric === 'speed') {
        // Inverted: low speed → tall extrusion
        return ['max', minHeight, ['*', ['-', max, ['coalesce', ['get', 'speed'], 0]], scale]];
    }
    return ['max', minHeight, ['*', ['coalesce', ['get', metric], 0], scale]];
};

// ── Heatmap layer builder ────────────────────────────────────────────

/**
 * Builds the heatmap layer spec for a given source and config.
 * @ignore
 */
export const buildHeatmapLayerSpec = (
    layerId: string,
    config?: TrafficAreaAnalyticsConfig,
): ToBeAddedLayerSpecWithoutSource<HeatmapLayerSpecification> => {
    const metric = config?.metric ?? 'congestionLevel';
    const { min, max } = METRIC_RANGES[metric];

    return {
        id: layerId,
        type: 'heatmap',
        beforeID: resolveBeforeID(config?.beforeLayerConfig?.heatmap),
        paint: {
            'heatmap-weight': ['interpolate', ['linear'], ['get', metric], min, 0, max, 1],
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 6, 0.5, 12, 1.5],
            'heatmap-color': buildHeatmapColorExpression(metric, config),
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 6, 15, 12, 30],
            'heatmap-opacity': 0.8,
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
): ToBeAddedLayerSpecWithoutSource<FillLayerSpecification> => ({
    id: layerId,
    type: 'fill',
    beforeID: resolveBeforeID(config?.beforeLayerConfig?.hexgrid?.flat2D),
    paint: {
        'fill-color': buildColorExpression(config?.metric ?? 'congestionLevel', config),
        'fill-opacity': 0.6,
    },
});

/**
 * Builds the extruded hex layer spec.
 * @ignore
 */
export const buildHexExtrusionLayerSpec = (
    layerId: string,
    config?: TrafficAreaAnalyticsConfig,
): ToBeAddedLayerSpecWithoutSource<FillExtrusionLayerSpecification> => {
    const metric = config?.metric ?? 'congestionLevel';

    return {
        id: layerId,
        type: 'fill-extrusion',
        beforeID: resolveExtrusionBeforeID(config?.beforeLayerConfig?.hexgrid?.extrusion3D),
        paint: {
            'fill-extrusion-color': buildColorExpression(metric, config),
            'fill-extrusion-height': buildHeightExpression(metric),
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
): ToBeAddedLayerSpecWithoutSource<FillLayerSpecification> => ({
    id: layerId,
    type: 'fill',
    beforeID: resolveBeforeID(config?.beforeLayerConfig?.square?.flat2D),
    paint: {
        'fill-color': buildColorExpression(config?.metric ?? 'congestionLevel', config),
        'fill-opacity': 0.6,
    },
});

/**
 * Builds the extruded square layer spec.
 * @ignore
 */
export const buildSquareExtrusionLayerSpec = (
    layerId: string,
    config?: TrafficAreaAnalyticsConfig,
): ToBeAddedLayerSpecWithoutSource<FillExtrusionLayerSpecification> => {
    const metric = config?.metric ?? 'congestionLevel';

    return {
        id: layerId,
        type: 'fill-extrusion',
        beforeID: resolveExtrusionBeforeID(config?.beforeLayerConfig?.square?.extrusion3D),
        paint: {
            'fill-extrusion-color': buildColorExpression(metric, config),
            'fill-extrusion-height': buildHeightExpression(metric),
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.75,
        },
    };
};

// ── Region boundary layer builders ───────────────────────────────────

const DEFAULT_REGION_COLOR = '#000000';
const DEFAULT_REGION_FILL_OPACITY = 0.05;
const DEFAULT_REGION_OUTLINE_OPACITY = 0.8;
const DEFAULT_REGION_OUTLINE_WIDTH = 2;

/**
 * Resolves the region display config with defaults applied.
 * @ignore
 */
const resolveRegionConfig = (region?: AreaAnalyticsRegionPolygonConfig) => ({
    color: region?.color ?? DEFAULT_REGION_COLOR,
    fillOpacity: region?.fillOpacity ?? DEFAULT_REGION_FILL_OPACITY,
    outlineOpacity: region?.outlineOpacity ?? DEFAULT_REGION_OUTLINE_OPACITY,
    outlineWidth: region?.outlineWidth ?? DEFAULT_REGION_OUTLINE_WIDTH,
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

/**
 * Builds the flat tile fill layer spec.
 * @ignore
 */
export const buildTileFillLayerSpec = (layerId: string): ToBeAddedLayerSpecWithoutSource<FillLayerSpecification> => ({
    ...areaAnalyticsTileFillSpec,
    id: layerId,
    beforeID: mapStyleLayerIDs.lowestLabel,
});

/**
 * Builds the extruded tile layer spec.
 * @ignore
 */
export const buildTileExtrusionLayerSpec = (
    layerId: string,
): ToBeAddedLayerSpecWithoutSource<FillExtrusionLayerSpecification> => ({
    ...areaAnalyticsTileExtrusionSpec,
    id: layerId,
    beforeID: mapStyleLayerIDs.lowestPlaceLabel,
});
