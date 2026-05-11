/**
 * @module agent-toolkit-tools
 */

import { bboxFromGeoJSON } from '@tomtom-org/maps-sdk/core';
import type { LngLatBoundsLike } from 'maplibre-gl';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

/**
 * Tool schema for showing traffic area analytics on the map.
 */
export const showTrafficAreaAnalyticsSchema = z.object({
    mode: z
        .enum(['hexgrid-3d', 'hexgrid-2d', 'square-3d', 'square-2d', 'heatmap'])
        .optional()
        .describe(
            "Visualization mode. 'hexgrid-3d' (default): 3D hexagons. 'hexgrid-2d': flat hexagons. 'square-3d': 3D squares. 'square-2d': flat squares. 'heatmap': density layer.",
        ),
    metric: z
        .enum(['congestionLevel', 'speed', 'travelTime'])
        .optional()
        .describe('Metric to visualize. Defaults to first fetched metric.'),
    colorTheme: z
        .enum(['trafficLight', 'heat', 'monochrome', 'viridis', 'plasma'])
        .optional()
        .describe(
            "Preset color theme. 'trafficLight' (green→amber→red, default), 'heat' (blue→orange→red), 'monochrome' (grey), 'viridis' (purple→green→yellow), 'plasma' (purple→magenta→yellow).",
        ),
    heightScale: z
        .number()
        .optional()
        .describe('Extrusion height multiplier / visual maximum in meters. Default: metric-dependent.'),
    scaleMode: z
        .enum(['raw', 'predefinedRange', 'currentRange'])
        .optional()
        .describe(
            "Height scaling mode. 'raw': metric value × scale (default). 'predefinedRange': normalize to SDK predefined range so max = scale. 'currentRange': normalize to live data range so max = scale.",
        ),
    filter: z
        .object({
            min: z.number().optional(),
            max: z.number().optional(),
        })
        .refine((filter) => filter.min !== undefined || filter.max !== undefined, {
            message: 'Filter must have at least one of min or max',
        })
        .optional()
        .describe('Filter visible tiles for the active metric by value range.'),
    visible: z.boolean().optional().describe('Set to false to clear the visualization. Default: true.'),
    fitBounds: z.boolean().optional().describe('Fit map viewport to the analytics area. Default: true.'),
});

/** Output schema for the show-traffic-area-analytics tool. */
export const showTrafficAreaAnalyticsOutputSchema = z.union([
    z.object({
        success: z.literal(true),
        mode: z.string(),
        metric: z.string(),
        colorTheme: z.string(),
        visible: z.boolean(),
        filtered: z.boolean(),
    }),
    toolErrorSchema,
]);

export const showTrafficAreaAnalyticsDescription =
    'Render HISTORICAL traffic analytics (hexgrid/heatmap) on the map after getTrafficAreaAnalytics. ' +
    'Configure metric, color theme, height, and tile filtering; defaults to the first fetched metric. ' +
    'Not real-time — use toggleTrafficFlow for live traffic.';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Tool factory
// ---------------------------------------------------------------------------

/**
 * Execute show traffic area analytics.
 */
export const executeShowTrafficAreaAnalytics = async (
    params: z.infer<typeof showTrafficAreaAnalyticsSchema>,
    state: ToolState,
): Promise<z.infer<typeof showTrafficAreaAnalyticsOutputSchema>> => {
    try {
        // Get stored analytics result
        const analyticsResult = state.trafficAreaAnalytics.lastAreaAnalytics;
        if (!analyticsResult) {
            return { error: 'No analytics data available. Call getTrafficAreaAnalytics first to fetch data.' };
        }

        // Default metric to first fetched metric
        const defaultMetric = analyticsResult.properties?.metrics?.[0] ?? 'congestionLevel';

        const {
            mode = 'hexgrid-3d',
            metric = defaultMetric,
            colorTheme = 'trafficLight',
            heightScale,
            scaleMode,
            filter,
            visible = true,
            fitBounds: shouldFitBounds = true,
        } = params;

        // Lazy-init TrafficAreaAnalyticsModule
        const analyticsModule = await state.trafficAreaAnalytics.getTrafficAreaAnalyticsModule();

        if (!visible) {
            await analyticsModule.clear();
            state.trafficAreaAnalytics.notifyAnalyticsCleared();
            return { success: true, mode, metric, colorTheme, visible: false, filtered: false };
        }

        // Clear previous visualization before showing new data
        await analyticsModule.clear();
        await analyticsModule.show(analyticsResult);

        // Apply mode and active metric
        analyticsModule.setMode(mode);
        analyticsModule.setMetric(metric);

        // Apply color theme
        analyticsModule.setColor(colorTheme);

        // Apply height config
        if (heightScale !== undefined || scaleMode !== undefined) {
            analyticsModule.setHeight({
                ...(heightScale !== undefined && { maxHeightMeters: heightScale }),
                ...(scaleMode !== undefined && { scaleMode }),
            });
        }

        // Apply tile filter for active metric
        const isFiltered = !!filter;
        if (filter) {
            analyticsModule.filter({ min: filter.min, max: filter.max });
        } else {
            analyticsModule.clearFilter();
        }

        // Fit map to analytics area
        if (shouldFitBounds) {
            const bbox = bboxFromGeoJSON(analyticsResult.features);
            if (bbox) {
                state.baseMap.mapLibreMap.fitBounds(bbox as LngLatBoundsLike, { padding: 50, pitch: 45 });
            }
        }

        state.trafficAreaAnalytics.notifyAnalyticsShown(analyticsResult, analyticsModule);

        return {
            success: true,
            mode,
            metric,
            colorTheme,
            visible: true,
            filtered: isFiltered,
        };
    } catch (error) {
        return {
            error: `Failed to show traffic area analytics: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
