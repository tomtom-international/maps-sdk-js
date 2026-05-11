/**
 * @module agent-toolkit-tools
 */

import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

export const recallRangesSchema = z.object({
    id: z.string().optional().describe('Entry ID to retrieve (e.g. "ranges-0"). Omit to list all entries.'),
});

const indexEntrySchema = z.object({
    id: z.string(),
    label: z.string(),
    timestamp: z.number(),
    originCount: z.number(),
});

const rangeSummarySchema = z.object({
    origin: z.object({
        query: z.string().optional(),
        position: z.tuple([z.number(), z.number()]),
    }),
    budgets: z.array(z.object({ type: z.string(), value: z.number() })),
});

const detailSchema = z.object({
    id: z.string(),
    label: z.string(),
    timestamp: z.number(),
    ranges: z.array(rangeSummarySchema),
});

const entryModeSchema = z
    .enum(['single', 'multiple'])
    .describe(
        'Display policy: `multiple` (default) lets several reachable-range entries render at once; ' +
            '`single` enforces "at most one entry on the map" — switching to it auto-clears non-latest entries.',
    );

export const recallRangesOutputSchema = z.union([
    z.object({ entries: z.array(indexEntrySchema), entryMode: entryModeSchema }),
    detailSchema.extend({ entryMode: entryModeSchema }),
    toolErrorSchema,
]);

export const recallRangesDescription =
    'List stored reachable-range results, or retrieve one by `id` (returns each origin and its budgets). ' +
    'Multi-origin entries surface every origin under `ranges`. Never guess IDs — list first. No service call.';

export const executeRecallRanges = async (
    params: z.infer<typeof recallRangesSchema>,
    state: ToolState,
): Promise<z.infer<typeof recallRangesOutputSchema>> => {
    const { id } = params;
    const entryMode = state.ranges.entryMode;

    if (!id) {
        const entries = [...state.ranges.entries].reverse().map(({ id, label, timestamp, ranges }) => ({
            id,
            label,
            timestamp,
            originCount: ranges.length,
        }));
        return { entries, entryMode };
    }

    const entry = state.ranges.entries.find((e) => e.id === id);
    if (!entry) {
        return { error: `No entry found with id "${id}"` };
    }

    return {
        id: entry.id,
        label: entry.label,
        timestamp: entry.timestamp,
        ranges: entry.ranges.map((r) => ({
            origin: { ...r.origin, position: r.origin.position as [number, number] },
            budgets: r.budgets,
        })),
        entryMode,
    };
};
