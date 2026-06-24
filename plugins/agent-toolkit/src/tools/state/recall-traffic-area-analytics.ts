/**
 * @module agent-toolkit-tools
 */

import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

export const recallTrafficAreaAnalyticsSchema = z.object({
    id: z
        .string()
        .optional()
        .describe('Traffic-area-analytics entry id to inspect (e.g. "tta-0"). Omit to list every analytics entry.'),
});

const entryModeSchema = z
    .enum(['single', 'multiple'])
    .describe(
        'Display policy: `multiple` (default) lets several analytics entries render at once; ' +
            '`single` keeps only the latest entry — switching to it auto-clears the others.',
    );

const indexEntrySchema = z.object({
    id: z.string(),
    label: z.string(),
    timestamp: z.number(),
    regionCount: z.number().describe('Number of analysed regions (features) in this entry.'),
    metrics: z
        .array(z.string())
        .describe('Traffic metrics included in the report (e.g. ["congestionLevel", "speed"]).'),
    shown: z.boolean().describe('True while this entry is rendered on the map.'),
});

const detailSchema = indexEntrySchema.extend({
    dateRange: z
        .object({ start: z.string(), end: z.string() })
        .describe('Analysis period (ISO dates) — empty strings when the entry carries no date metadata.'),
    regions: z.array(z.string()).describe('Names of the analysed regions, in feature order.'),
    heatmap: z.boolean().describe('Whether tile-level heatmap data is included.'),
});

export const recallTrafficAreaAnalyticsOutputSchema = z.union([
    z.object({ entries: z.array(indexEntrySchema), entryMode: entryModeSchema }),
    detailSchema.extend({ entryMode: entryModeSchema }),
    toolErrorSchema,
]);

export const recallTrafficAreaAnalyticsDescription =
    'List stored traffic-area-analytics entries, or inspect one by `id`. No args → index (id, label, regionCount, ' +
    'metrics, shown). Pass `id` → that entry plus its date range, region names, and heatmap flag. Pass an id to ' +
    '`trafficAreaAnalyticsEntryIDs` on analyseData / processData to compute over the metric values. Never guess ' +
    'IDs — list first. No service call.';

// ISO `Date` → "YYYY-MM-DD"; tolerates a missing/invalid date (entry built without date metadata).
const isoDate = (value: Date | undefined): string => {
    if (!value || Number.isNaN(value.getTime())) return '';
    return value.toISOString().slice(0, 10);
};

export const executeRecallTrafficAreaAnalytics = async (
    params: z.infer<typeof recallTrafficAreaAnalyticsSchema>,
    state: ToolState,
): Promise<z.infer<typeof recallTrafficAreaAnalyticsOutputSchema>> => {
    const slice = state.trafficAreaAnalytics;
    const entryMode = slice.entryMode;

    if (!params.id) {
        // Newest-first, matching every other recall index.
        const entries = [...slice.entries].reverse().map((entry) => ({
            id: entry.id,
            label: entry.label,
            timestamp: entry.timestamp,
            regionCount: entry.data.features.length,
            metrics: entry.data.properties.metrics,
            shown: slice.shownEntryIds.has(entry.id),
        }));
        return { entries, entryMode };
    }

    const entry = slice.findById(params.id);
    if (!entry) {
        return {
            error: `No traffic-area-analytics entry with id "${params.id}". Call recallState({ kind: "trafficAreaAnalytics" }) to list available IDs.`,
        };
    }

    const properties = entry.data.properties;
    return {
        id: entry.id,
        label: entry.label,
        timestamp: entry.timestamp,
        regionCount: entry.data.features.length,
        metrics: properties.metrics,
        shown: slice.shownEntryIds.has(entry.id),
        dateRange: { start: isoDate(properties.startDate), end: isoDate(properties.endDate) },
        regions: entry.data.features.map((feature) => feature.properties.name),
        heatmap: properties.heatmap,
        entryMode,
    };
};
