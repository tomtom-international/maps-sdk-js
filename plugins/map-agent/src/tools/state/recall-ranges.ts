/**
 * @module map-agent-tools
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
});

const detailSchema = z.object({
    id: z.string(),
    label: z.string(),
    timestamp: z.number(),
    origin: z.object({
        query: z.string().optional(),
        position: z.tuple([z.number(), z.number()]),
    }),
    budgets: z.array(z.object({ type: z.string(), value: z.number() })),
});

export const recallRangesOutputSchema = z.union([
    z.object({ entries: z.array(indexEntrySchema) }),
    detailSchema,
    toolErrorSchema,
]);

export const recallRangesDescription =
    'Retrieve a stored reachable range result from session history. ' +
    'Step 1: call with no parameters to list all entries and find the right ID. Do NOT guess IDs. ' +
    'Step 2: call with id to retrieve origin and budgets. ' +
    'Does not call any service.';

export async function executeRecallRanges(
    params: z.infer<typeof recallRangesSchema>,
    state: ToolState,
): Promise<z.infer<typeof recallRangesOutputSchema>> {
    const { id } = params;

    if (!id) {
        const entries = [...state.ranges.entries]
            .reverse()
            .map(({ id, label, timestamp }) => ({ id, label, timestamp }));
        return { entries };
    }

    const entry = state.ranges.entries.find((e) => e.id === id);
    if (!entry) {
        return { error: `No entry found with id "${id}"` };
    }

    return {
        id: entry.id,
        label: entry.label,
        timestamp: entry.timestamp,
        origin: { ...entry.origin, position: entry.origin.position as [number, number] },
        budgets: entry.budgets,
    };
}
