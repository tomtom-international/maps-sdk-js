/**
 * @module agent-toolkit-tools
 */

import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

const sliceSchema = z.enum(['places', 'routes', 'ranges']);
const modeSchema = z.enum(['single', 'multiple']);

/** Output schema for the setEntryMode tool. */
export const setEntryModeOutputSchema = z.union([
    z.object({
        success: z.literal(true),
        slice: sliceSchema,
        mode: modeSchema,
        droppedEntryIds: z
            .array(z.string())
            .describe('Entry IDs removed from history because the new mode is `single` and they were not the latest.'),
    }),
    toolErrorSchema,
]);

/** Input schema for setEntryMode. */
export const setEntryModeSchema = z.object({
    slice: sliceSchema.describe('Which history to reconfigure: places / routes / ranges.'),
    mode: modeSchema.describe(
        '`multiple` (default) lets several entries render at once; ' +
            '`single` keeps only the latest entry — switching to it auto-clears every older entry.',
    ),
});

export const setEntryModeDescription =
    'Switch the display policy of one history slice (places, routes, or ranges) between `multiple` and `single`. ' +
    '`single` ⇒ at most one entry on the map, and any older entries get dropped from history immediately. ' +
    'Use when the user asks for a "clean view" / "only show one at a time" or wants to compare overlays again.';

export const executeSetEntryMode = async (
    params: z.infer<typeof setEntryModeSchema>,
    state: ToolState,
): Promise<z.infer<typeof setEntryModeOutputSchema>> => {
    const { slice, mode } = params;
    try {
        // Snapshot ids the slice was about to drop so we can report them back —
        // setEntryMode runs the trim internally and emits an event, but the
        // caller benefits from a concrete list (e.g. to mention by id in the
        // chat reply).
        const beforeIds = (() => {
            switch (slice) {
                case 'places':
                    return state.places.entries.map((e) => e.id);
                case 'routes':
                    return state.routing.entries.map((e) => e.id);
                case 'ranges':
                    return state.ranges.entries.map((e) => e.id);
            }
        })();

        switch (slice) {
            case 'places':
                await state.places.setEntryMode(mode);
                break;
            case 'routes':
                await state.routing.setEntryMode(mode);
                break;
            case 'ranges':
                await state.ranges.setEntryMode(mode);
                break;
        }

        const afterIds = (() => {
            switch (slice) {
                case 'places':
                    return new Set(state.places.entries.map((e) => e.id));
                case 'routes':
                    return new Set(state.routing.entries.map((e) => e.id));
                case 'ranges':
                    return new Set(state.ranges.entries.map((e) => e.id));
            }
        })();
        const droppedEntryIds = beforeIds.filter((id) => !afterIds.has(id));

        return { success: true, slice, mode, droppedEntryIds };
    } catch (error) {
        return {
            error: `Failed to set entry mode: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
