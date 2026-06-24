/**
 * @module agent-toolkit-tools
 *
 * `getTrackers` — list the active trackers and their live state (what each watches, whether it is
 * currently firing). Introspection so the agent can answer "what am I tracking" and surface the entries
 * a tracker reads (its analysis's `affectedEntryIds`).
 */

import { z } from 'zod';
import type { ToolState } from '../../types';

export const getTrackersSchema = z.object({});

export const getTrackersOutputSchema = z.object({
    trackers: z.array(
        z.object({
            trackerId: z.string(),
            name: z.string(),
            rule: z.string(),
            enabled: z.boolean(),
            firing: z.boolean().describe('Whether the rule is currently active (an open episode).'),
            openedAt: z.number().optional(),
            watching: z.array(z.string()).describe('Source entry ids the rule reads.'),
        }),
    ),
    count: z.number(),
});

export const getTrackersDescription =
    'List active trackers: name, rule, enabled, whether firing now, and which entries each watches.';

export const executeGetTrackers = async (
    _params: Record<string, never>,
    state: ToolState,
): Promise<z.infer<typeof getTrackersOutputSchema>> => {
    const trackers = state.trackers.trackers.map((t) => ({
        trackerId: t.id,
        name: t.name,
        rule: t.rule,
        enabled: t.enabled,
        firing: t.wasActive,
        ...(t.openedAt !== undefined && { openedAt: t.openedAt }),
        watching: [...(state.analyses.get(t.analysisId)?.affectedEntryIds ?? [])],
    }));
    return { trackers, count: trackers.length };
};
