/**
 * @module map-agent-tools
 */

import { calculateRoute } from '@tomtom-org/maps-sdk/services';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { makeRoutesLabel } from '../../utils/state-labels';
import { summarizeRoutes } from '../../utils/summarize';
import { routesOutputSchema, toolErrorSchema } from '../shared-output-schemas';
import { buildCalculateRouteParams, resolveRouteWaypoints, showRouteOnMap } from './set-route-locations';

/** Output schema for the remove-stop-from-route tool. */
export const removeStopFromRouteOutputSchema = z.union([routesOutputSchema, toolErrorSchema]);

/**
 * Tool schema for removing a stop from an existing route.
 */
export const removeStopFromRouteSchema = z.object({
    stopIndex: z.number().int().describe('0=origin, last=destination; min 2 waypoints must remain'),
    showOnMap: z.boolean().describe('Show the updated route and waypoints on the map after recalculation.'),
});

export const removeStopFromRouteDescription =
    'Remove a stop from the current route by index and always triggers a route recalculation. ' +
    'Index 0 is the origin, last index is the destination — both must remain. ' +
    'Requires an existing route (call setRouteLocations first).';

function validateRemoveStop<T>(waypoints: T[] | null | undefined, stopIndex: number): string | T[] {
    if (!waypoints || waypoints.length < 2) {
        return 'No existing waypoints available. Use calculate-route first to create a route with waypoints.';
    }
    if (stopIndex < 0 || stopIndex >= waypoints.length) {
        return `Invalid stop index ${stopIndex}. Valid range is 0 to ${waypoints.length - 1}.`;
    }
    if (waypoints.length <= 2) {
        return 'Cannot remove a stop: at least 2 waypoints (origin and destination) must remain.';
    }
    return waypoints;
}

/**
 * Create the remove stop from route tool.
 */
/** Standalone execute for ToolEntry format. */
export async function executeRemoveStopFromRoute(
    params: z.infer<typeof removeStopFromRouteSchema>,
    state: ToolState,
): Promise<z.infer<typeof removeStopFromRouteOutputSchema>> {
    const { stopIndex, showOnMap } = params;
    try {
        const validated = validateRemoveStop(state.routing.currentWaypoints, stopIndex);
        if (typeof validated === 'string') return { error: validated };

        const updatedWaypointsPlaces = validated.filter((_, i) => i !== stopIndex);

        const waypoints = resolveRouteWaypoints(updatedWaypointsPlaces);
        if (!waypoints) {
            return { error: 'Not enough valid waypoints to calculate a route (minimum 2).' };
        }

        const routes = await calculateRoute({
            locations: waypoints,
            ...buildCalculateRouteParams(state.routing.params),
        });

        state.routing.addRoutes(routes, waypoints, makeRoutesLabel(routes, waypoints));

        if (showOnMap) {
            await showRouteOnMap(state, routes, waypoints);
        }

        return summarizeRoutes(routes);
    } catch (error) {
        return {
            error: `Failed to remove stop from route: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}
