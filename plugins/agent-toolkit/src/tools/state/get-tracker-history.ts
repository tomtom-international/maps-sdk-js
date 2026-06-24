/**
 * @module agent-toolkit-tools
 *
 * `getTrackerHistory` — read what trackers have fired (opened alerts + resolved events), newest first.
 * Reports the retained window honestly so the model never implies history older than the bounded log
 * holds. Optionally scoped to one tracker and/or a `sinceMs` cutoff.
 */

import { z } from 'zod';
import type { ToolState } from '../../types';

export const getTrackerHistorySchema = z.object({
    trackerId: z.string().optional().describe('Scope to one tracker. Omit for every tracker.'),
    sinceMs: z.number().optional().describe('Only events at/after this epoch-ms sample time.'),
});

const eventSchema = z.object({
    at: z.number(),
    trackerId: z.string(),
    trackerName: z.string(),
    type: z.enum(['alert', 'event']),
    kind: z.enum(['opened', 'resolved']),
    summary: z.string(),
    openedAt: z.number().optional(),
});

export const getTrackerHistoryOutputSchema = z.object({
    events: z.array(eventSchema).describe('Newest first.'),
    count: z.number(),
    coverage: z
        .object({ oldestRetainedAt: z.number(), newestAt: z.number() })
        .optional()
        .describe('Sample-time span the bounded log currently retains — older events were evicted.'),
});

export const getTrackerHistoryDescription =
    'Read the tracker event log — `opened` alerts and `resolved` events, newest first. Optionally scope ' +
    'to one `trackerId` or a `sinceMs` cutoff. The log is bounded; `coverage` reports how far back it reaches.';

export const executeGetTrackerHistory = async (
    params: { trackerId?: string; sinceMs?: number },
    state: ToolState,
): Promise<z.infer<typeof getTrackerHistoryOutputSchema>> => {
    const retained = state.trackers.log({ trackerId: params.trackerId });
    const filtered = state.trackers.log({ trackerId: params.trackerId, sinceMs: params.sinceMs });
    const events = [...filtered].reverse().map((e) => ({
        at: e.at,
        trackerId: e.trackerId,
        trackerName: e.trackerName,
        type: e.type,
        kind: e.kind,
        summary: e.summary,
        ...(e.openedAt !== undefined && { openedAt: e.openedAt }),
    }));

    return {
        events,
        count: events.length,
        ...(retained.length > 0 && {
            coverage: { oldestRetainedAt: retained[0].at, newestAt: retained[retained.length - 1].at },
        }),
    };
};
