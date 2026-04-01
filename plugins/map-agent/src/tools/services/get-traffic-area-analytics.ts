/**
 * @module map-agent-tools
 */

import type { TrafficAreaAnalytics } from '@tomtom-org/maps-sdk/core';
import { trafficAreaAnalytics } from '@tomtom-org/maps-sdk/services';
import type { TrafficAreaAnalyticsParams } from '@tomtom-org/maps-sdk/services';
import { type Tool, tool } from 'ai';
import type { Polygon, MultiPolygon } from 'geojson';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

// ---------------------------------------------------------------------------
// Constants (inline — the SDK only type-exports these)
// ---------------------------------------------------------------------------

const DATA_TYPES = ['SPEED', 'CONGESTION_LEVEL', 'FREE_FLOW_SPEED', 'TRAVEL_TIME', 'NETWORK_LENGTH'] as const;

const FUNCTIONAL_ROAD_CLASSES = [
    'MOTORWAY',
    'MAJOR_ROAD',
    'OTHER_MAJOR_ROAD',
    'SECONDARY_ROAD',
    'LOCAL_CONNECTING_ROAD',
    'LOCAL_ROAD_HIGH_IMPORTANCE',
    'LOCAL_ROAD',
    'LOCAL_ROAD_MINOR_IMPORTANCE',
    'OTHER_ROAD',
] as const;

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

export const metricsSchema = z.object({
    speed: z.number().optional(),
    freeFlowSpeed: z.number().optional(),
    congestionLevel: z.number().optional(),
    travelTime: z.number().optional(),
    networkLength: z.number().optional(),
});

/** Output schema for the get-traffic-area-analytics tool. */
export const getTrafficAreaAnalyticsOutputSchema = z.union([
    z.object({
        name: z.string().optional(),
        timezone: z.string().optional(),
        dateRange: z.object({ start: z.string(), end: z.string() }),
        baseData: metricsSchema,
        dataTypes: z.array(z.string()),
        tileCount: z.number(),
        availableGranularities: z.array(z.string()),
    }),
    toolErrorSchema,
]);

/**
 * Tool schema for fetching traffic area analytics.
 */
export const getTrafficAreaAnalyticsSchema = z.object({
    bbox: z
        .array(z.number())
        .length(4)
        .optional()
        .describe('[minLng, minLat, maxLng, maxLat] — use a wide area (at least 5-10km across, city-level) for meaningful results. Too-small areas produce sparse, hard-to-read visualizations.'),
    geometry: z
        .object({
            type: z.enum(['Polygon', 'MultiPolygon']),
            coordinates: z.any(),
        })
        .optional()
        .describe('GeoJSON Polygon or MultiPolygon geometry. Use for precise boundaries. Mutually exclusive with bbox.'),
    startDate: z.string().optional().describe("Start date 'YYYY-MM-DD'. Use with endDate for a continuous range (max 31 days)."),
    endDate: z.string().optional().describe("End date 'YYYY-MM-DD' (inclusive). Defaults to today if omitted."),
    days: z.array(z.string()).optional().describe("Specific dates 'YYYY-MM-DD' for non-consecutive analysis. Mutually exclusive with startDate/endDate."),
    dataTypes: z.array(z.enum([...DATA_TYPES])).describe("Traffic metrics to analyze. Prefer fetching all: ['SPEED', 'CONGESTION_LEVEL', 'FREE_FLOW_SPEED', 'TRAVEL_TIME', 'NETWORK_LENGTH'] unless the user asks for specific ones."),
    functionalRoadClasses: z
        .union([z.literal('all'), z.array(z.enum([...FUNCTIONAL_ROAD_CLASSES]))])
        .optional()
        .describe("Road classes to include. 'all' (default) or array of specific classes."),
    hours: z
        .union([z.literal('all'), z.array(z.number().int().min(0).max(23))])
        .optional()
        .describe("Hours of the day (0-23) to include. 'all' (default) or array like [7,8,9,17,18] for rush hours."),
});

export const getTrafficAreaAnalyticsDescription =
    'Fetch historical traffic analytics for a geographic area (max 31 days). ' +
    'Fetch all data types in a single call — visualization requires all metrics in one result. ' +
    'Use a wide bounding box (city-level, ~10km+) for meaningful data. ' +
    'Returns period averages. Use queryTrafficAnalytics for breakdowns, showTrafficAreaAnalytics to visualize.';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert [minLng, minLat, maxLng, maxLat] to a GeoJSON Polygon. */
function bboxToPolygon(bbox: number[]): Polygon {
    const [minLng, minLat, maxLng, maxLat] = bbox;
    return {
        type: 'Polygon',
        coordinates: [
            [
                [minLng, minLat],
                [maxLng, minLat],
                [maxLng, maxLat],
                [minLng, maxLat],
                [minLng, minLat],
            ],
        ],
    };
}

/** Format a Date to 'YYYY-MM-DD'. */
export function toDateString(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Safely format a date value (Date object or string) to 'YYYY-MM-DD', or undefined if invalid. */
export function formatDate(value: unknown): string | undefined {
    if (value instanceof Date) {
        return isNaN(value.getTime()) ? undefined : toDateString(value);
    }
    if (typeof value === 'string') return value.slice(0, 10);
    return undefined;
}

/** Extract metrics from a timed entry, omitting undefined values. */
export function extractMetrics(entry: Record<string, unknown>) {
    return {
        ...(entry.speed !== undefined && { speed: entry.speed as number }),
        ...(entry.freeFlowSpeed !== undefined && { freeFlowSpeed: entry.freeFlowSpeed as number }),
        ...(entry.congestionLevel !== undefined && { congestionLevel: entry.congestionLevel as number }),
        ...(entry.travelTime !== undefined && { travelTime: entry.travelTime as number }),
        ...(entry.networkLength !== undefined && { networkLength: entry.networkLength as number }),
    };
}

/** Compact summary of the analytics result — just headline numbers + what's available for drill-down. */
function summarize(result: TrafficAreaAnalytics, inputStartDate?: string, inputEndDate?: string): z.infer<typeof getTrafficAreaAnalyticsOutputSchema> {
    const region = result.features[0]?.properties;
    if (!region) {
        return { dateRange: { start: '', end: '' }, baseData: {}, dataTypes: [], tileCount: 0, availableGranularities: [] };
    }

    // SDK defaults to startDate=3 days ago, endDate=2 days ago when omitted
    const defaultStart = () => { const d = new Date(); d.setDate(d.getDate() - 3); return toDateString(d); };
    const defaultEnd = () => { const d = new Date(); d.setDate(d.getDate() - 2); return toDateString(d); };

    const start = inputStartDate ?? formatDate(result.properties?.startDate) ?? defaultStart();
    const end = inputEndDate ?? formatDate(result.properties?.endDate) ?? defaultEnd();

    const availableGranularities: string[] = [];
    if (region.timedData?.yearly?.length) availableGranularities.push('yearly');
    if (region.timedData?.monthly?.length) availableGranularities.push('monthly');
    if (region.timedData?.weekly?.length) availableGranularities.push('weekly');
    if (region.timedData?.daily?.length) availableGranularities.push('daily');
    if (region.timedData?.hourly?.length) availableGranularities.push('hourly');
    if (region.timedData?.average?.length) availableGranularities.push('average');

    return {
        ...(region.name && { name: region.name }),
        ...(region.timezone && { timezone: region.timezone }),
        dateRange: { start, end },
        baseData: region.baseData,
        dataTypes: result.properties?.dataTypes ?? [],
        tileCount: region.tiledData?.tiles?.length ?? 0,
        availableGranularities,
    };
}

// ---------------------------------------------------------------------------
// Tool factory
// ---------------------------------------------------------------------------

/**
 * Create the get traffic area analytics tool.
 */
export function createGetTrafficAreaAnalyticsTool(state: ToolState): Tool {
    return tool({
        description: getTrafficAreaAnalyticsDescription,
        inputSchema: getTrafficAreaAnalyticsSchema,
        outputSchema: getTrafficAreaAnalyticsOutputSchema,
        execute: async (params): Promise<z.infer<typeof getTrafficAreaAnalyticsOutputSchema>> => {
            const { bbox, geometry, startDate, endDate, days, dataTypes, functionalRoadClasses, hours } = params;

            // Validate geometry input
            if (!bbox && !geometry) {
                return { error: 'Provide either a bbox or a geometry' };
            }

            if (!dataTypes || dataTypes.length === 0) {
                return { error: 'At least one dataType is required' };
            }

            // Resolve geometry
            const resolvedGeometry: Polygon | MultiPolygon = geometry
                ? (geometry as Polygon | MultiPolygon)
                : bboxToPolygon(bbox!);

            // Resolve dates — SDK defaults to startDate=3 days ago, endDate=2 days ago when omitted
            const dateParams: Pick<TrafficAreaAnalyticsParams, 'startDate' | 'endDate' | 'days'> = {};
            if (days && days.length > 0) {
                dateParams.days = days;
            } else if (startDate) {
                dateParams.startDate = startDate;
                if (endDate) dateParams.endDate = endDate;
            }

            // Move Portal API key (different from standard TomTom key)
            const apiKey = process.env.MOVE_PORTAL_KEY;
            if (!apiKey) {
                return { error: 'MOVE_PORTAL_KEY environment variable is not set.' };
            }

            try {
                const result = await trafficAreaAnalytics({
                    apiKey,
                    ...dateParams,
                    dataTypes,
                    functionalRoadClasses: functionalRoadClasses ?? 'all',
                    hours: hours ?? 'all',
                    geometry: resolvedGeometry,
                } as TrafficAreaAnalyticsParams);

                // Store full result for showTrafficAreaAnalytics to use
                state.traffic.setLastAreaAnalytics(result);

                return summarize(
                    result,
                    typeof dateParams.startDate === 'string' ? dateParams.startDate : undefined,
                    typeof dateParams.endDate === 'string' ? dateParams.endDate : undefined,
                );
            } catch (error) {
                return {
                    error: `Failed to get traffic area analytics: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
