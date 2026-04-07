/**
 * @module map-agent-tools
 */

import { bboxFromGeoJSON, type Place, type TrafficAreaAnalytics } from '@tomtom-org/maps-sdk/core';
import type { TrafficAreaAnalyticsParams } from '@tomtom-org/maps-sdk/services';
import { geometryData, trafficAreaAnalytics } from '@tomtom-org/maps-sdk/services';
import type { MultiPolygon, Polygon } from 'geojson';
import type { LngLatBoundsLike } from 'maplibre-gl';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { locationInputSchema, resolveLocationInput } from '../shared/location-input';
import { toolErrorSchema } from '../shared-output-schemas';

// ---------------------------------------------------------------------------
// Constants (inline — the SDK only type-exports these)
// ---------------------------------------------------------------------------

const METRICS = ['speed', 'congestionLevel', 'freeFlowSpeed', 'travelTime', 'networkLength'] as const;

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
        metrics: z.array(z.string()),
        tileCount: z.number(),
        availableGranularities: z.array(z.string()),
    }),
    toolErrorSchema,
]);

/**
 * Tool schema for fetching traffic area analytics.
 */
export const getTrafficAreaAnalyticsSchema = z.object({
    location: locationInputSchema
        .optional()
        .describe(
            'Named location (city, region, country) to fetch the boundary for. Resolved via geocoding + geometryData. Mutually exclusive with bbox and geometry.',
        ),
    bbox: z
        .array(z.number())
        .length(4)
        .optional()
        .describe(
            '[minLng, minLat, maxLng, maxLat] — use a wide area (at least 5-10km across, city-level) for meaningful results. Mutually exclusive with location.',
        ),
    showOnMap: z
        .boolean()
        .optional()
        .describe('Visualize the result immediately with default settings. Use showTrafficAreaAnalytics to customize.'),
    startDate: z
        .string()
        .optional()
        .describe("Start date 'YYYY-MM-DD'. Use with endDate for a continuous range (max 31 days)."),
    endDate: z.string().optional().describe("End date 'YYYY-MM-DD' (inclusive). Defaults to today if omitted."),
    days: z
        .array(z.string())
        .optional()
        .describe(
            "Specific dates 'YYYY-MM-DD' for non-consecutive analysis. Mutually exclusive with startDate/endDate.",
        ),
    metrics: z
        .union([z.literal('all'), z.array(z.enum([...METRICS])).min(1)])
        .describe(
            "Traffic metrics to analyze. Use 'all' (preferred) or an explicit array like ['speed', 'congestionLevel', 'freeFlowSpeed', 'travelTime', 'networkLength'].",
        ),
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
    'Provide area via location (named city/region, resolved to boundary polygon) or bbox. ' +
    'Fetch all metrics in a single call — visualization requires all metrics in one result. ' +
    'Use city-level areas (~10km+) for meaningful data. ' +
    'Returns period averages. Use showOnMap to visualize immediately, queryTrafficAnalytics for breakdowns.';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Convert [minLng, minLat, maxLng, maxLat] to a GeoJSON Polygon.
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

// Resolve the analytics area geometry from a location query or bbox.
async function resolveGeometry(
    location: z.infer<typeof locationInputSchema> | undefined,
    bbox: number[] | undefined,
): Promise<Polygon | MultiPolygon | { error: string }> {
    if (location) {
        const resolved = await resolveLocationInput(location);
        if (!resolved) return { error: 'Could not resolve the provided location.' };
        if (Array.isArray(resolved.place)) {
            return {
                error: 'A bare position cannot define an analytics area. Provide a named location query instead.',
            };
        }
        // resolved.place is a Place at runtime (locatePlace always returns Place | null)
        const boundary = await geometryData({ geometries: [resolved.place as unknown as Place] });
        const boundaryGeometry = boundary?.features?.[0]?.geometry as Polygon | MultiPolygon | undefined;
        if (!boundaryGeometry) {
            return { error: `No boundary polygon found for "${resolved.name}". Try a bbox instead.` };
        }
        return boundaryGeometry;
    }
    if (!bbox) return { error: 'No area provided.' };
    return bboxToPolygon(bbox);
}

// Resolve which date parameters to forward to the SDK from the tool inputs.
function resolveDateParams(
    days: string[] | undefined,
    startDate: string | undefined,
    endDate: string | undefined,
): { startDate?: string; endDate?: string; days?: string[] } {
    if (days && days.length > 0) return { days };
    if (startDate) return endDate ? { startDate, endDate } : { startDate };
    return {};
}

// Show analytics on the map with default settings, fitting the viewport.
async function showAnalyticsOnMap(state: ToolState, result: TrafficAreaAnalytics): Promise<void> {
    const analyticsModule = await state.traffic.getTrafficAreaAnalyticsModule();
    await analyticsModule.clear();
    await analyticsModule.show(result);
    const defaultMetric = result.properties?.metrics?.[0] ?? 'congestionLevel';
    analyticsModule.setMetric(defaultMetric);
    const bbox = bboxFromGeoJSON(result.features);
    if (bbox) {
        state.baseMap.mapLibreMap.fitBounds(bbox as LngLatBoundsLike, { padding: 50, pitch: 45 });
    }
    state.traffic.onAnalyticsShown?.(result, analyticsModule);
}

/** Format a Date to 'YYYY-MM-DD'. */
export function toDateString(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Safely format a date value (Date object or string) to 'YYYY-MM-DD', or undefined if invalid. */
export function formatDate(value: unknown): string | undefined {
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? undefined : toDateString(value);
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
function summarize(
    result: TrafficAreaAnalytics,
    inputStartDate?: string,
    inputEndDate?: string,
): z.infer<typeof getTrafficAreaAnalyticsOutputSchema> {
    const region = result.features[0]?.properties;
    if (!region) {
        return {
            dateRange: { start: '', end: '' },
            baseData: {},
            metrics: [],
            tileCount: 0,
            availableGranularities: [],
        };
    }

    // SDK defaults to startDate=3 days ago, endDate=2 days ago when omitted
    const defaultStart = () => {
        const d = new Date();
        d.setDate(d.getDate() - 3);
        return toDateString(d);
    };
    const defaultEnd = () => {
        const d = new Date();
        d.setDate(d.getDate() - 2);
        return toDateString(d);
    };

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
        metrics: result.properties?.metrics ?? [],
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
/** Standalone execute for ToolEntry format. */
export async function executeGetTrafficAreaAnalytics(
    params: z.infer<typeof getTrafficAreaAnalyticsSchema>,
    state: ToolState,
): Promise<z.infer<typeof getTrafficAreaAnalyticsOutputSchema>> {
    const { location, bbox, showOnMap, startDate, endDate, days, metrics, functionalRoadClasses, hours } = params;

    if (!location && !bbox) {
        return { error: 'Provide a location or bbox to define the analytics area.' };
    }

    // Move Portal API key (different from standard TomTom key)
    const apiKey = process.env.MOVE_PORTAL_KEY;
    if (!apiKey) {
        return { error: 'MOVE_PORTAL_KEY environment variable is not set.' };
    }

    try {
        const resolvedGeometry = await resolveGeometry(location, bbox);
        if ('error' in resolvedGeometry) return resolvedGeometry;

        // Resolve dates — SDK defaults to startDate=3 days ago, endDate=2 days ago when omitted
        const dateParams = resolveDateParams(days, startDate, endDate);

        const result = await trafficAreaAnalytics({
            apiKey,
            ...dateParams,
            metrics,
            functionalRoadClasses: functionalRoadClasses ?? 'all',
            hours: hours ?? 'all',
            geometry: resolvedGeometry,
        } as TrafficAreaAnalyticsParams);

        state.traffic.setLastAreaAnalytics(result);

        if (showOnMap) {
            await showAnalyticsOnMap(state, result);
        }

        return summarize(result, dateParams.startDate, dateParams.endDate);
    } catch (error) {
        return {
            error: `Failed to get traffic area analytics: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}
