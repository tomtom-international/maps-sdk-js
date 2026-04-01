import type {
    ExpressionSpecification,
    FillExtrusionLayerSpecification,
    FillLayerSpecification,
    HeatmapLayerSpecification,
} from 'maplibre-gl';
import type { LayerSpecTemplate, ToBeAddedLayerSpecWithoutSource } from '../../shared';
import { mapStyleLayerIDs } from '../../shared';
import type {
    AreaAnalyticsColorConfig,
    AreaAnalyticsColorScheme,
    AreaAnalyticsHeightConfig,
    AreaAnalyticsMetricKey,
    MetricRange,
} from '../types/trafficAreaAnalyticsConfig';

// ── Colour scheme presets ────────────────────────────────────────────

/** @ignore */
export type ColorStops = { low: string; mid: string; high: string };

/** @ignore */
export const COLOR_SCHEMES: Record<AreaAnalyticsColorScheme, ColorStops> = {
    congestion: { low: '#2dc653', mid: '#f5a623', high: '#e03030' },
    thermal: { low: '#2196F3', mid: '#FF9800', high: '#F44336' },
    monochrome: { low: '#e0e0e0', mid: '#888888', high: '#1a1a1a' },
};

const DEFAULT_SCHEME: AreaAnalyticsColorScheme = 'congestion';

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

/** @ignore */
export const DEFAULT_MIN_HEIGHT = 10;

// ── Color resolution ────────────────────────────────────────────────

/**
 * Resolve color stops from config, falling back to preset or default scheme.
 * @ignore
 */
export function resolveColorStops(
    colorConfig?: AreaAnalyticsColorConfig,
    schemeFallback?: AreaAnalyticsColorScheme,
): ColorStops {
    if (colorConfig?.stops) {
        return { low: colorConfig.stops[0], mid: colorConfig.stops[1], high: colorConfig.stops[2] };
    }
    return COLOR_SCHEMES[colorConfig?.preset ?? schemeFallback ?? DEFAULT_SCHEME];
}

// ── Expression builders ─────────────────────────────────────────────

/**
 * Builds a MapLibre interpolation expression that maps a metric property
 * to a three-stop colour scale.
 *
 * For `speed` the scale is inverted (high speed = low colour, low speed = high colour).
 * @ignore
 */
export const buildColorExpression = (
    metric: AreaAnalyticsMetricKey,
    colors: ColorStops,
    range?: MetricRange,
): ExpressionSpecification => {
    const { min, mid, max } = range ?? METRIC_RANGES[metric];
    const { low, mid: midColor, high } = colors;

    if (metric === 'speed') {
        // Inverted: high speed (low colour) → low speed (high colour)
        return ['interpolate', ['linear'], ['get', metric], min, high, mid, midColor, max, low];
    }
    return ['interpolate', ['linear'], ['get', metric], min, low, mid, midColor, max, high];
};

/**
 * Builds a MapLibre `heatmap-color` expression using the given color stops.
 * @ignore
 */
export const buildHeatmapColorExpression = (colors: ColorStops): ExpressionSpecification => {
    return ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(0,0,0,0)', 0.3, colors.low, 0.6, colors.mid, 1, colors.high];
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

// ── Heatmap layer template ───────────────────────────────────────────

/**
 * @ignore
 */
export const areaAnalyticsHeatmapSpec: LayerSpecTemplate<HeatmapLayerSpecification> = {
    type: 'heatmap',
    paint: {
        'heatmap-weight': ['interpolate', ['linear'], ['get', 'congestionLevel'], 0, 0, 100, 1],
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 6, 0.5, 12, 1.5],
        'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(45,198,83,0)',
            0.3,
            COLOR_SCHEMES.congestion.low,
            0.6,
            COLOR_SCHEMES.congestion.mid,
            1,
            COLOR_SCHEMES.congestion.high,
        ],
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 6, 15, 12, 30],
        'heatmap-opacity': 0.8,
    },
};

// ── Hexgrid fill layer template ──────────────────────────────────────

/**
 * @ignore
 */
export const areaAnalyticsHexFillSpec: LayerSpecTemplate<FillLayerSpecification> = {
    type: 'fill',
    paint: {
        'fill-color': buildColorExpression('congestionLevel', COLOR_SCHEMES.congestion),
        'fill-opacity': 0.6,
    },
};

// ── Hexgrid fill-extrusion layer template ────────────────────────────

/**
 * @ignore
 */
export const areaAnalyticsHexExtrusionSpec: LayerSpecTemplate<FillExtrusionLayerSpecification> = {
    type: 'fill-extrusion',
    paint: {
        'fill-extrusion-color': buildColorExpression('congestionLevel', COLOR_SCHEMES.congestion),
        'fill-extrusion-height': buildHeightExpression('congestionLevel'),
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.75,
    },
};

// ── Tile fill layer template ─────────────────────────────────────────

/**
 * @ignore
 */
export const areaAnalyticsTileFillSpec: LayerSpecTemplate<FillLayerSpecification> = {
    type: 'fill',
    paint: {
        'fill-color': buildColorExpression('congestionLevel', COLOR_SCHEMES.congestion),
        'fill-opacity': 0.6,
    },
};

/**
 * @ignore
 */
export const areaAnalyticsTileExtrusionSpec: LayerSpecTemplate<FillExtrusionLayerSpecification> = {
    type: 'fill-extrusion',
    paint: {
        'fill-extrusion-color': buildColorExpression('congestionLevel', COLOR_SCHEMES.congestion),
        'fill-extrusion-height': buildHeightExpression('congestionLevel'),
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.75,
    },
};

// ── Layer spec builders ──────────────────────────────────────────────

/**
 * Builds the heatmap layer spec for a given source.
 * @ignore
 */
export const buildHeatmapLayerSpec = (layerId: string): ToBeAddedLayerSpecWithoutSource<HeatmapLayerSpecification> => ({
    ...areaAnalyticsHeatmapSpec,
    id: layerId,
    beforeID: mapStyleLayerIDs.lowestLabel,
});

/**
 * Builds the flat hex fill layer spec.
 * @ignore
 */
export const buildHexFillLayerSpec = (layerId: string): ToBeAddedLayerSpecWithoutSource<FillLayerSpecification> => ({
    ...areaAnalyticsHexFillSpec,
    id: layerId,
    beforeID: mapStyleLayerIDs.lowestLabel,
});

/**
 * Builds the extruded hex layer spec.
 * @ignore
 */
export const buildHexExtrusionLayerSpec = (
    layerId: string,
): ToBeAddedLayerSpecWithoutSource<FillExtrusionLayerSpecification> => ({
    ...areaAnalyticsHexExtrusionSpec,
    id: layerId,
    beforeID: mapStyleLayerIDs.lowestPlaceLabel,
});

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
