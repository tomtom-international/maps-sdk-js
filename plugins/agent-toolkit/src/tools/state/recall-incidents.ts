/**
 * @module agent-toolkit-tools
 */

import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

export const recallIncidentsSchema = z.object({
    id: z
        .string()
        .optional()
        .describe('Incidents entry id to inspect (e.g. "incidents-0"). Omit to list every incidents entry.'),
});

const entryModeSchema = z
    .enum(['single', 'multiple'])
    .describe(
        'Display policy: `multiple` (default) lets several incidents entries render at once; ' +
            '`single` keeps only the latest entry — switching to it auto-clears the others.',
    );

const indexEntrySchema = z.object({
    id: z.string(),
    label: z.string(),
    timestamp: z.number(),
    count: z.number().describe('Number of incidents captured in this entry.'),
    shown: z.boolean().describe('True while this entry is rendered on the map.'),
    monitored: z.boolean().describe('True while a background monitor is actively polling this entry.'),
    focusedCount: z.number().describe("Incidents in the entry's focus subset (0 when nothing is focused)."),
});

const detailSchema = indexEntrySchema.extend({
    byMagnitude: z
        .record(z.string(), z.number())
        .describe('Incident count grouped by `magnitudeOfDelay` (e.g. `{ major: 3, moderate: 5, minor: 10 }`).'),
    totalDelaySeconds: z.number().describe('Sum of `delayInSeconds` across the entry (0 when no delay data).'),
    clusterCount: z
        .number()
        .optional()
        .describe('Number of incident clusters computed for this entry — present only once clustering has run.'),
});

export const recallIncidentsOutputSchema = z.union([
    z.object({ entries: z.array(indexEntrySchema), entryMode: entryModeSchema }),
    detailSchema.extend({ entryMode: entryModeSchema }),
    toolErrorSchema,
]);

export const recallIncidentsDescription =
    'List stored traffic-incidents entries, or inspect one by `id`. No args → index (id, label, count, shown, ' +
    'monitored, focusedCount). Pass `id` → that entry plus a `magnitudeOfDelay` breakdown, total delay, and the ' +
    'cluster count when clustering has run. Never guess IDs — list first. No service call.';

export const executeRecallIncidents = async (
    params: z.infer<typeof recallIncidentsSchema>,
    state: ToolState,
): Promise<z.infer<typeof recallIncidentsOutputSchema>> => {
    const slice = state.trafficIncidents;
    const entryMode = slice.entryMode;

    if (!params.id) {
        // Newest-first, matching every other recall index.
        const entries = [...slice.entries].reverse().map((entry) => ({
            id: entry.id,
            label: entry.label,
            timestamp: entry.timestamp,
            count: entry.data.length,
            shown: slice.shownEntryIds.has(entry.id),
            monitored: slice.isMonitored(entry.id),
            focusedCount: slice.getFocus(entry.id)?.ids.size ?? 0,
        }));
        return { entries, entryMode };
    }

    const entry = slice.entries.find((e) => e.id === params.id);
    if (!entry) {
        return {
            error: `No incidents entry with id "${params.id}". Call recallState({ kind: "incidents" }) to list available IDs.`,
        };
    }

    const byMagnitude: Record<string, number> = {};
    let totalDelaySeconds = 0;
    for (const incident of entry.data) {
        const magnitude = incident.properties.magnitudeOfDelay;
        byMagnitude[magnitude] = (byMagnitude[magnitude] ?? 0) + 1;
        totalDelaySeconds += incident.properties.delayInSeconds ?? 0;
    }
    const clusters = slice.getClusters(entry.id);

    return {
        id: entry.id,
        label: entry.label,
        timestamp: entry.timestamp,
        count: entry.data.length,
        shown: slice.shownEntryIds.has(entry.id),
        monitored: slice.isMonitored(entry.id),
        focusedCount: slice.getFocus(entry.id)?.ids.size ?? 0,
        byMagnitude,
        totalDelaySeconds,
        ...(clusters && { clusterCount: clusters.groups.length }),
        entryMode,
    };
};
