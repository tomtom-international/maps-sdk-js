/**
 * @module agent-toolkit-tools
 */

import { z } from 'zod';
import { ENTRY_MODE_SLICE_NAMES, type EntryModeSlice, type EntryModeSliceName } from '../../state';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

// `z.enum` needs a non-empty tuple. ENTRY_MODE_SLICE_NAMES is derived from a
// `Record<EntryModeSliceName, true>` check at the type level, so the runtime
// list is always non-empty whenever the union has at least one member.
const sliceSchema = z.enum(ENTRY_MODE_SLICE_NAMES as unknown as [EntryModeSliceName, ...EntryModeSliceName[]]);
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
    slice: sliceSchema.describe(
        'Which entry-owning slice to reconfigure. Names match the keys on the agent state exactly — ' +
            '`routing` (not `routes`), `customGeometries` (not `geometries`), and so on.',
    ),
    mode: modeSchema.describe(
        '`multiple` (default) lets several entries render at once; ' +
            '`single` keeps only the latest entry — switching to it auto-clears every older entry.',
    ),
});

export const setEntryModeDescription =
    'Switch the display policy of one entry-owning slice between `multiple` and `single`. ' +
    `Supported slices: ${ENTRY_MODE_SLICE_NAMES.join(', ')}. ` +
    '`single` ⇒ at most one entry on the map, and any older entries get dropped from history immediately. ' +
    'Use when the user asks for a "clean view" / "only show one at a time" or wants to compare overlays again.';

export const executeSetEntryMode = async (
    params: z.infer<typeof setEntryModeSchema>,
    state: ToolState,
): Promise<z.infer<typeof setEntryModeOutputSchema>> => {
    const { slice, mode } = params;
    try {
        // Index into state with the slice name — names match keys exactly, so
        // there is no `case 'routes': state.routing.…` style mismatch to maintain.
        const target = state[slice] as EntryModeSlice;

        // Snapshot ids the slice was about to drop so we can report them back —
        // setEntryMode runs the trim internally and emits an event, but the
        // caller benefits from a concrete list (e.g. to mention by id in the
        // chat reply).
        const beforeIds = target.entries.map((e) => e.id);

        await target.setEntryMode(mode);

        const afterIds = new Set(target.entries.map((e) => e.id));
        const droppedEntryIds = beforeIds.filter((id) => !afterIds.has(id));

        return { success: true, slice, mode, droppedEntryIds };
    } catch (error) {
        return {
            error: `Failed to set entry mode: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
