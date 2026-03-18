import type {
    ExpressionSpecification,
    FillExtrusionLayerSpecification,
    FillLayerSpecification,
    HeatmapLayerSpecification,
} from 'maplibre-gl';
import type { LayerSpecTemplate, ToBeAddedLayerSpecWithoutSource } from '../../shared';
import { mapStyleLayerIDs } from '../../shared';
import type { AreaAnalyticsMetricKey } from '../types/trafficAreaAnalyticsConfig';

// ── Traffic signal colour stops ──────────────────────────────────────
const GREEN = '#2dc653';
const AMBER = '#f5a623';
const RED = '#e03030';

// ── Metric ranges used for colour / height interpolation ─────────────
const METRIC_RANGES: Record<AreaAnalyticsMetricKey, { min: number; mid: number; max: number }> = {
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
 * to the green → amber → red colour scale.
 *
 * For `speed` the scale is inverted (high speed = green, low = red).
 * @ignore
 */
export function buildColorExpression(
    metric: AreaAnalyticsMetricKey,
): ExpressionSpecification {
    const { min, mid, max } = METRIC_RANGES[metric];

    if (metric === 'speed') {
        // Inverted: high speed (green) → low speed (red)
        return ['interpolate', ['linear'], ['get', metric], min, RED, mid, AMBER, max, GREEN];
    }
    return ['interpolate', ['linear'], ['get', metric], min, GREEN, mid, AMBER, max, RED];
}

/**
 * Builds a MapLibre expression for fill-extrusion height driven by the active metric.
 * @ignore
 */
export function buildHeightExpression(
    metric: AreaAnalyticsMetricKey,
): ExpressionSpecification {
    const scale = HEIGHT_SCALE[metric];

    if (metric === 'speed') {
        // Inverted: low speed → tall extrusion
        return [
            'max',
            10,
            ['*', ['-', METRIC_RANGES.speed.max, ['coalesce', ['get', 'speed'], 0]], scale],
        ];
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
            GREEN,
            0.6,
            AMBER,
            1.0,
            RED,
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
