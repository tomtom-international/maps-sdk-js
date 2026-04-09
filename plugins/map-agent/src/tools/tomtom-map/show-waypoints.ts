/**
 * @module map-agent-tools
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
    'Display origin, stop, and destination waypoints as markers on the map. ' +
    'Context-dependent: requires setRouteLocations or locatePlace with waypointIndex to have been called first. ' +
    'Does not recalculate the route. Prefer showRoute when you also need the route line drawn.';

/**
 * Execute show waypoints.
 */
export async function executeShowWaypoints(
    _params: z.infer<typeof showWaypointsSchema>,
    state: ToolState,
): Promise<z.infer<typeof showWaypointsOutputSchema>> {
    try {
        // Prefer the current (possibly sparse) waypoints being assembled;
        // fall back to the last finalized waypoints from route history.
        const current = state.routing.planningSlots;

        const routingModule = await state.routing.getRoutingModule();
        await routingModule.showWaypoints(current);

        return { success: true, count: current.length };
    } catch (error) {
        return {
            error: `Failed to show waypoints: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}
