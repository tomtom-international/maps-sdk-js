/**
 * @module agent-toolkit-tools
 */

import { z } from 'zod';
import type { ToolState } from '../../types';
import { extractMetrics, formatDate, metricsSchema, toDateString } from '../services/get-traffic-area-analytics';
import { toolErrorSchema } from '../shared-output-schemas';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const timedEntrySchema = metricsSchema.extend({
    date: z.string().optional(),
    hour: z.number().optional(),
    year: z.number().optional(),
    month: z.number().optional(),
    week: z.number().optional(),
    day: z.number().optional(),
});

export const queryTrafficAnalyticsSchema = z.object({
    granularity: z
        .enum(['daily', 'hourly', 'weekly', 'monthly', 'yearly', 'average'])
        .optional()
        .describe("Time granularity. Default: 'daily'. Use 'average' for day-of-week × hour patterns."),
    metric: z
        .enum(['speed', 'congestionLevel', 'freeFlowSpeed', 'travelTime', 'networkLength'])
        .optional()
        .describe('Filter to a single metric. Default: all requested metrics.'),
    startDate: z
        .string()
        .optional()
        .describe("Filter entries from this date (YYYY-MM-DD). Works with 'daily' and 'hourly'."),
    endDate: z
        .string()
        .optional()
        .describe("Filter entries up to this date (YYYY-MM-DD). Works with 'daily' and 'hourly'."),
    hourStart: z
        .number()
        .int()
        .min(0)
        .max(23)
        .optional()
        .describe('Filter hourly/average entries from this hour (0-23).'),
    hourEnd: z
        .number()
        .int()
        .min(0)
        .max(23)
        .optional()
        .describe('Filter hourly/average entries up to this hour (0-23).'),
    dayOfWeek: z
        .array(z.number().int().min(1).max(7))
        .optional()
        .describe("Filter 'average' entries by day of week (1=Mon…7=Sun)."),
});

/** Output schema for the query-traffic-analytics tool. */
export const queryTrafficAnalyticsOutputSchema = z.union([
    z.object({
        granularity: z.string(),
        count: z.number(),
        entries: z.array(timedEntrySchema),
        currentVisualization: z
            .object({
                activeMetric: z.string().optional(),
                displayMode: z.string().optional(),
            })
            .optional(),
    }),
    toolErrorSchema,
]);

export const queryTrafficAnalyticsDescription =
    'Query cached traffic analytics (from getTrafficAreaAnalytics) without re-fetching — filter by granularity, date/hour range, day, metric. ' +
    'Returns filtered entries plus the current map visualization state (metric, mode). Use for breakdowns and "what is shown" follow-ups.';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Derive a date string for a daily/hourly entry using index fallback. */
const resolveDateStr = (
    entryDate: unknown,
    index: number,
    granularity: string,
    startDateStr?: string,
): string | undefined => {
    const direct = formatDate(entryDate);
    if (direct) return direct;
    if (startDateStr && index >= 0) {
        const d = new Date(startDateStr);
        if (!Number.isNaN(d.getTime())) {
            const dayOffset = granularity === 'hourly' ? Math.floor(index / 24) : index;
            d.setDate(d.getDate() + dayOffset);
            return toDateString(d);
        }
    }
    return undefined;
};

// ---------------------------------------------------------------------------
// Tool factory
// ---------------------------------------------------------------------------

/**
 * Create the query traffic analytics tool.
 */
/** Standalone execute for ToolEntry format. */
export const executeQueryTrafficAnalytics = async (
    params: z.infer<typeof queryTrafficAnalyticsSchema>,
    state: ToolState,
): Promise<z.infer<typeof queryTrafficAnalyticsOutputSchema>> => {
    const { granularity = 'daily', metric, startDate, endDate, hourStart, hourEnd, dayOfWeek } = params;

    const analytics = state.trafficAreaAnalytics.lastAreaAnalytics;
    if (!analytics) {
        return { error: 'No analytics data cached. Call getTrafficAreaAnalytics first.' };
    }

    const region = analytics.features[0]?.properties;
    if (!region) {
        return { error: 'Analytics result has no region data.' };
    }

    const timedData = region.timedData;
    const rawEntries = timedData?.[granularity as keyof typeof timedData];
    if (!rawEntries || !Array.isArray(rawEntries) || rawEntries.length === 0) {
        return {
            error: `No '${granularity}' data available. Available: ${Object.keys(timedData ?? {}).join(', ')}`,
        };
    }

    // Resolve start date for index-based date derivation
    const collectionStartDate = formatDate(analytics.properties?.startDate);

    // Map and filter entries
    let entries = rawEntries.map((entry, index) => {
        const mapped: Record<string, unknown> = {};

        // Temporal fields
        if (granularity === 'daily' || granularity === 'hourly') {
            const dateStr = resolveDateStr(entry.date, index, granularity, collectionStartDate);
            if (dateStr) mapped.date = dateStr;
        }
        if (entry.hour !== undefined) mapped.hour = entry.hour;
        if (entry.year !== undefined) mapped.year = entry.year;
        if (entry.month !== undefined) mapped.month = entry.month;
        if (entry.week !== undefined) mapped.week = entry.week;
        if (entry.day !== undefined) mapped.day = entry.day;

        // Metrics
        if (metric) {
            const val = (entry as Record<string, unknown>)[metric];
            if (val !== undefined) mapped[metric] = val;
        } else {
            Object.assign(mapped, extractMetrics(entry));
        }

        return mapped;
    });

    // Apply date range filter (daily/hourly)
    if (startDate) {
        entries = entries.filter((e) => !e.date || (e.date as string) >= startDate);
    }
    if (endDate) {
        entries = entries.filter((e) => !e.date || (e.date as string) <= endDate);
    }

    // Apply hour range filter (hourly/average)
    if (hourStart !== undefined) {
        entries = entries.filter((e) => e.hour === undefined || (e.hour as number) >= hourStart);
    }
    if (hourEnd !== undefined) {
        entries = entries.filter((e) => e.hour === undefined || (e.hour as number) <= hourEnd);
    }

    // Apply day-of-week filter (average)
    if (dayOfWeek && dayOfWeek.length > 0) {
        entries = entries.filter((e) => e.day === undefined || dayOfWeek.includes(e.day as number));
    }

    // Include current visualization state so LLM knows what's displayed
    const vizConfig = state.trafficAreaAnalytics.currentAnalyticsConfig;
    const currentVisualization = vizConfig
        ? {
              activeMetric: vizConfig.activeMetric,
              displayMode: vizConfig.displayMode,
          }
        : undefined;

    return {
        granularity,
        count: entries.length,
        entries: entries as z.infer<typeof timedEntrySchema>[],
        ...(currentVisualization && { currentVisualization }),
    };
};
