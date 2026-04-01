/**
 * @module map-agent-tools
 */

import { bboxFromGeoJSON } from '@tomtom-org/maps-sdk/core';
import type { AreaAnalyticsMetricKey, AreaAnalyticsMode } from '@tomtom-org/maps-sdk/map';
import { type Tool, tool } from 'ai';
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
        .enum(['hexgrid', 'heatmap', 'tiles'])
        .optional()
        .describe("Visualization mode. 'hexgrid' (default): 3D hexagons. 'heatmap': density layer. 'tiles': raw API squares (no aggregation)."),
    metric: z
        .enum(['congestionLevel', 'speed', 'travelTime'])
        .optional()
        .describe('Metric to visualize. Defaults to first fetched metric.'),
    colorScheme: z
        .enum(['congestion', 'thermal', 'monochrome'])
        .optional()
        .describe("Preset color scheme. 'congestion' (green→red), 'thermal' (blue→red), 'monochrome' (grey)."),
    customColors: z
        .array(z.string())
        .length(3)
        .optional()
        .describe("Custom 3-stop gradient [low, mid, high] as CSS colors. Overrides colorScheme. E.g. ['#00ff00', '#ffff00', '#ff0000']."),
    flat: z
        .boolean()
        .optional()
        .describe('Disable 3D extrusion, render flat polygons. Default: false.'),
    heightScale: z
        .number()
        .optional()
        .describe('Extrusion height multiplier. Higher = taller bars. Default: metric-dependent.'),
    filter: z
        .object({
            metric: z.enum(['congestionLevel', 'speed', 'travelTime']),
            min: z.number().optional(),
            max: z.number().optional(),
        })
        .optional()
        .describe("Filter visible tiles by metric threshold. E.g. { metric: 'congestionLevel', min: 50 } shows only congested areas."),
    rangeStrategy: z
        .enum(['auto', 'fixed', 'union'])
        .optional()
        .describe("Color/height range strategy. 'union' (default): expand hardcoded when data exceeds. 'auto': scale to data. 'fixed': use hardcoded ranges."),
    tooltip: z
        .boolean()
        .optional()
        .describe('Enable hover tooltip showing metric values. Default: true.'),
    visible: z
        .boolean()
        .optional()
        .describe('Set to false to clear the visualization. Default: true.'),
    fitBounds: z
        .boolean()
        .optional()
        .describe('Fit map viewport to the analytics area. Default: true.'),
});

/** Output schema for the show-traffic-area-analytics tool. */
export const showTrafficAreaAnalyticsOutputSchema = z.union([
    z.object({
        success: z.literal(true),
        mode: z.string(),
        metric: z.string(),
        colorScheme: z.string(),
        visible: z.boolean(),
        filtered: z.boolean(),
        tooltipEnabled: z.boolean(),
    }),
    toolErrorSchema,
]);

export const showTrafficAreaAnalyticsDescription =
    'Show HISTORICAL traffic area analytics on the map (hexgrid/heatmap/tiles). ' +
    'Not real-time — use toggleTrafficFlow for live traffic. ' +
    'Configure metric, colors, height, tile filtering, and hover tooltip. ' +
    'Use after getTrafficAreaAnalytics. Defaults to first fetched metric with tooltip enabled.';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DATA_TYPE_TO_METRIC: Record<string, AreaAnalyticsMetricKey> = {
    CONGESTION_LEVEL: 'congestionLevel',
    SPEED: 'speed',
    TRAVEL_TIME: 'travelTime',
};

// ---------------------------------------------------------------------------
// Tool factory
// ---------------------------------------------------------------------------

/**
 * Create the show traffic area analytics tool.
 */
export function createShowTrafficAreaAnalyticsTool(state: ToolState): Tool {
    return tool({
        description: showTrafficAreaAnalyticsDescription,
        inputSchema: showTrafficAreaAnalyticsSchema,
        outputSchema: showTrafficAreaAnalyticsOutputSchema,
        execute: async (params): Promise<z.infer<typeof showTrafficAreaAnalyticsOutputSchema>> => {
            try {
                // Get stored analytics result
                const analyticsResult = state.traffic.lastAreaAnalytics;
                if (!analyticsResult) {
                    return { error: 'No analytics data available. Call getTrafficAreaAnalytics first to fetch data.' };
                }

                // Default metric to first fetched dataType
                const firstFetchedType = analyticsResult.properties?.dataTypes?.[0];
                const defaultMetric = firstFetchedType
                    ? DATA_TYPE_TO_METRIC[firstFetchedType] ?? 'congestionLevel'
                    : 'congestionLevel';

                const {
                    mode = 'hexgrid',
                    metric = defaultMetric,
                    colorScheme = 'congestion',
                    customColors,
                    flat,
                    heightScale,
                    filter,
                    rangeStrategy,
                    tooltip = true,
                    visible = true,
                    fitBounds: shouldFitBounds = true,
                } = params;

                // Lazy-init TrafficAreaAnalyticsModule
                const analyticsModule = await state.traffic.getTrafficAreaAnalyticsModule();

                if (!visible) {
                    analyticsModule.clear();
                    state.traffic.controlPanel?.hide();
                    return { success: true, mode, metric, colorScheme, visible: false, filtered: false, tooltipEnabled: false };
                }

                // Clear previous visualization before showing new data
                analyticsModule.clear();
                await analyticsModule.show(analyticsResult);

                // Apply mode and metric
                analyticsModule.setMode(mode);
                analyticsModule.setMetric(metric);

                // Apply colors (custom stops take precedence over preset)
                if (customColors) {
                    analyticsModule.setColors({ stops: customColors });
                } else {
                    analyticsModule.setColorScheme(colorScheme);
                }

                // Apply height config
                if (flat !== undefined || heightScale !== undefined) {
                    analyticsModule.setHeight({
                        ...(flat !== undefined && { flat }),
                        ...(heightScale !== undefined && { scale: heightScale }),
                    });
                }

                // Apply range strategy
                if (rangeStrategy) {
                    analyticsModule.setRanges(metric as AreaAnalyticsMetricKey, { strategy: rangeStrategy });
                }

                // Apply tile filter
                const isFiltered = !!filter;
                if (filter) {
                    analyticsModule.filter({ any: [{ metric: filter.metric, min: filter.min, max: filter.max }] });
                } else {
                    analyticsModule.clearFilter();
                }

                // Enable tooltip
                analyticsModule.setTooltip({ enabled: tooltip });

                // Fit map to analytics area
                if (shouldFitBounds) {
                    const bbox = bboxFromGeoJSON(analyticsResult.features);
                    if (bbox) {
                        state.baseMap.mapLibreMap.fitBounds(bbox as LngLatBoundsLike, { padding: 50, pitch: 45 });
                    }
                }

                // Show control panel with metric/mode/color toggles + chart
                const panel = state.traffic.initControlPanel(
                    state.baseMap.mapLibreMap.getContainer(),
                    analyticsModule,
                );
                panel.show(analyticsResult);

                return {
                    success: true,
                    mode,
                    metric,
                    colorScheme: customColors ? 'custom' : colorScheme,
                    visible: true,
                    filtered: isFiltered,
                    tooltipEnabled: tooltip,
                };
            } catch (error) {
                return {
                    error: `Failed to show traffic area analytics: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
