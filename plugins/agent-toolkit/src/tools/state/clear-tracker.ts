/**
 * @module agent-toolkit-tools
 *
 * `clearTracker` — stop a tracker and tear down its rule job. Owns nothing else: the source entries are
 * the operator's (the tracker never owned them), so clearing only unregisters the tracker (which
 * unregisters its {@link JobEngine} job). Defaults to the sole tracker when only one exists.
 */

import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

export const clearTrackerSchema = z.object({
    trackerId: z.string().optional().describe('Which tracker to clear. Omit when only one tracker exists.'),
});

export const clearTrackerOutputSchema = z.union([
    z.object({ cleared: z.literal(true), trackerId: z.string(), name: z.string() }),
    toolErrorSchema,
]);

export const clearTrackerDescription =
    'Stop a tracker and remove its rule. Does not touch the watched entries (they were never the ' +
    "tracker's). Omit `trackerId` when there is only one tracker.";

export const executeClearTracker = async (
    params: { trackerId?: string },
    state: ToolState,
): Promise<z.infer<typeof clearTrackerOutputSchema>> => {
    const all = state.trackers.trackers;
    if (all.length === 0) return { error: 'No trackers to clear.' };

    const trackerId = params.trackerId ?? (all.length === 1 ? all[0].id : undefined);
    if (trackerId === undefined) {
        return { error: `Which tracker? Pass trackerId — one of: ${all.map((t) => t.id).join(', ')}.` };
    }
    const tracker = state.trackers.get(trackerId);
    if (!tracker) return { error: `No tracker "${trackerId}". Active: ${all.map((t) => t.id).join(', ') || 'none'}.` };

    state.trackers.unregister(trackerId);

    return { cleared: true, trackerId, name: tracker.name };
};
