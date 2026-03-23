import type {
    ExpressionSpecification,
    FillExtrusionLayerSpecification,
    FillLayerSpecification,
    HeatmapLayerSpecification,
} from 'maplibre-gl';
import type { LayerSpecTemplate, ToBeAddedLayerSpecWithoutSource } from '../../shared';
import { mapStyleLayerIDs } from '../../shared';
import type { AreaAnalyticsColorScheme, AreaAnalyticsMetricKey } from '../types/trafficAreaAnalyticsConfig';

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
export const METRIC_RANGES: Record<AreaAnalyticsMetricKey, { min: number; mid: number; max: number }> = {
    congestionLevel: { min: 0, mid: 50, max: 100 },
    speed: { min: 0, mid: 50, max: 120 },
    travelTime: { min: 0, mid: 10, max: 20 },
};

// ── Height multipliers per metric ────────────────────────────────────
const HEIGHT_SCALE: Record<AreaAnalyticsMetricKey, number> = {
    congestionLevel: 50,
    speed: 40,
    travelTime: 200,
};

/**
 * Builds a MapLibre interpolation expression that maps a metric property
 * to a three-stop colour scale from the given colour scheme.
 *
 * For `speed` the scale is inverted (high speed = low colour, low speed = high colour).
 * @ignore
 */
export function buildColorExpression(
    metric: AreaAnalyticsMetricKey,
    scheme: AreaAnalyticsColorScheme = DEFAULT_SCHEME,
): ExpressionSpecification {
    const { min, mid, max } = METRIC_RANGES[metric];
    const { low, mid: midColor, high } = COLOR_SCHEMES[scheme];

    if (metric === 'speed') {
        // Inverted: high speed (low colour) → low speed (high colour)
        return ['interpolate', ['linear'], ['get', metric], min, high, mid, midColor, max, low];
    }
    return ['interpolate', ['linear'], ['get', metric], min, low, mid, midColor, max, high];
}

/**
 * Builds a MapLibre `heatmap-color` expression using the given colour scheme.
 * @ignore
 */
export function buildHeatmapColorExpression(
    scheme: AreaAnalyticsColorScheme = DEFAULT_SCHEME,
): ExpressionSpecification {
    const { low, mid, high } = COLOR_SCHEMES[scheme];
    return ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(0,0,0,0)', 0.3, low, 0.6, mid, 1.0, high];
}

/**
 * Builds a MapLibre expression for fill-extrusion height driven by the active metric.
 * @ignore
 */
export function buildHeightExpression(metric: AreaAnalyticsMetricKey): ExpressionSpecification {
    const scale = HEIGHT_SCALE[metric];

    if (metric === 'speed') {
        // Inverted: low speed → tall extrusion
        return ['max', 10, ['*', ['-', METRIC_RANGES.speed.max, ['coalesce', ['get', 'speed'], 0]], scale]];
    }
    return ['max', 10, ['*', ['coalesce', ['get', metric], 0], scale]];
}

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
            1.0,
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
        'fill-color': buildColorExpression('congestionLevel'),
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
        'fill-extrusion-color': buildColorExpression('congestionLevel'),
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
export function buildHeatmapLayerSpec(layerId: string): ToBeAddedLayerSpecWithoutSource<HeatmapLayerSpecification> {
    return {
        ...areaAnalyticsHeatmapSpec,
        id: layerId,
        beforeID: mapStyleLayerIDs.lowestLabel,
    } as ToBeAddedLayerSpecWithoutSource<HeatmapLayerSpecification>;
}

/**
 * Builds the flat hex fill layer spec.
 * @ignore
 */
export function buildHexFillLayerSpec(layerId: string): ToBeAddedLayerSpecWithoutSource<FillLayerSpecification> {
    return {
        ...areaAnalyticsHexFillSpec,
        id: layerId,
        beforeID: mapStyleLayerIDs.lowestLabel,
    } as ToBeAddedLayerSpecWithoutSource<FillLayerSpecification>;
}

/**
 * Builds the extruded hex layer spec.
 * @ignore
 */
export function buildHexExtrusionLayerSpec(
    layerId: string,
): ToBeAddedLayerSpecWithoutSource<FillExtrusionLayerSpecification> {
    return {
        ...areaAnalyticsHexExtrusionSpec,
        id: layerId,
    } as ToBeAddedLayerSpecWithoutSource<FillExtrusionLayerSpecification>;
}
