/**
 * @module agent-toolkit-tools
 */

import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

/** Output schema for the update-waypoints-display tool. */
export const updateWaypointsDisplayOutputSchema = z.union([
    z.object({
        success: z.literal(true),
        visible: z.boolean(),
        count: z.number(),
    }),
    toolErrorSchema,
]);

/** Tool schema for update-waypoints-display. */
export const updateWaypointsDisplaySchema = z.object({
    visible: z
        .boolean()
        .optional()
        .describe(
            'Render the staged waypoints (true, default) or clear them (false). No route line is drawn either way.',
        ),
});

export const updateWaypointsDisplayDescription =
    'Show or hide the staged origin/stop/destination markers held in `state.routing.planningSlots` (the slots being ' +
    'built up for the next `setRoute` — NOT the waypoints of a calculated route entry). ' +
    'No route line is drawn; for that use `updateRoutesDisplay`. Requires at least one routes entry to host the module.';

/** Execute update-waypoints-display. */
export const executeUpdateWaypointsDisplay = async (
    params: z.infer<typeof updateWaypointsDisplaySchema>,
    state: ToolState,
): Promise<z.infer<typeof updateWaypointsDisplayOutputSchema>> => {
    const visible = params.visible ?? true;
    try {
        const firstShownId = [...state.routing.shownEntryIds][0];
        const latestEntry = state.routing.entries.at(-1);
        const targetEntryId = firstShownId ?? latestEntry?.id;
        if (!targetEntryId) {
            return { error: 'No route history yet — calculate a route via setRoute first.' };
        }
        const routingModule = await state.routing.getEntryRoutingModule(targetEntryId);

        if (!visible) {
            await routingModule.clearWaypoints();
            return { success: true, visible: false, count: 0 };
        }

        const current = state.routing.planningSlots;
        await routingModule.showWaypoints(current);
        return { success: true, visible: true, count: current.length };
    } catch (error) {
        return {
            error: `Failed to update waypoints display: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
