/**
 * @module agent-toolkit-tools
 */

import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

/** Output schema for the show-waypoints tool. */
export const showWaypointsOutputSchema = z.union([
    z.object({
        success: z.literal(true),
        count: z.number(),
    }),
    toolErrorSchema,
]);

/**
 * Tool schema for showing waypoints on the map.
 */
export const showWaypointsSchema = z.object({});

export const showWaypointsDescription =
    'Display origin/stop/destination markers (no route line; no recalculation). Requires staged waypoints from setRoute or locatePlace. ' +
    'Use updateRoutesDisplay when you also need the route line drawn.';

/**
 * Execute show waypoints.
 */
export const executeShowWaypoints = async (
    _params: z.infer<typeof showWaypointsSchema>,
    state: ToolState,
): Promise<z.infer<typeof showWaypointsOutputSchema>> => {
    try {
        // Prefer the current (possibly sparse) waypoints being assembled;
        // fall back to the last finalized waypoints from route history.
        const current = state.routing.planningSlots;

        // RoutingModules are per-entry now. Render planning waypoints on the
        // first currently-shown entry, or fall back to the latest entry in
        // history. If there's no history at all, surface a clear error.
        const firstShownId = [...state.routing.shownEntryIds][0];
        const latestEntry = state.routing.entries.at(-1);
        const targetEntryId = firstShownId ?? latestEntry?.id;
        if (!targetEntryId) {
            return { error: 'No route history yet — calculate a route via setRoute first.' };
        }
        const routingModule = await state.routing.getEntryRoutingModule(targetEntryId);
        await routingModule.showWaypoints(current);

        return { success: true, count: current.length };
    } catch (error) {
        return {
            error: `Failed to show waypoints: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
