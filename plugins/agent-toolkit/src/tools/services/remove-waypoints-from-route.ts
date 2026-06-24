/**
 * @module agent-toolkit-tools
 */

import { z } from 'zod';
import type { ToolState } from '../../types';
import { hidePreviousEntriesSchema } from '../shared';
import { routesWriteOutputSchema, toolErrorSchema } from '../shared-output-schemas';
import { calculateAndAddRoute, resolveRouteWaypoints } from './set-route';

/** Output schema for the remove-waypoints-from-route tool. */
export const removeWaypointsFromRouteOutputSchema = z.union([routesWriteOutputSchema, toolErrorSchema]);

/**
 * Tool schema for removing waypoints from an existing route.
 */
export const removeWaypointsFromRouteSchema = z.object({
    waypointIndices: z
        .array(z.number().int())
        .min(1)
        .describe(
            'Indices of waypoints to remove. 0=origin, last=destination. ' +
                'Min 2 waypoints must remain. Duplicates are not allowed.',
        ),
    showOnMap: z.boolean().describe('Show the updated route and waypoints on the map after recalculation.'),
    hidePreviousEntries: hidePreviousEntriesSchema('routes'),
});

export const removeWaypointsFromRouteDescription =
    'Remove one or more waypoints from the current route by index; always recalculates. ' +
    'Index 0 = origin, last = destination (both protected when removing them would leave fewer than 2). ' +
    'Requires an existing route.';

const validateRemoveWaypoints = <T>(
    waypoints: T[] | null | undefined,
    waypointIndices: readonly number[],
): string | T[] => {
    if (!waypoints || waypoints.length < 2) {
        return 'No existing waypoints available. Use calculate-route first to create a route with waypoints.';
    }
    const unique = new Set(waypointIndices);
    if (unique.size !== waypointIndices.length) {
        return 'Duplicate waypoint indices are not allowed.';
    }
    for (const idx of waypointIndices) {
        if (idx < 0 || idx >= waypoints.length) {
            return `Invalid waypoint index ${idx}. Valid range is 0 to ${waypoints.length - 1}.`;
        }
    }
    if (waypoints.length - waypointIndices.length < 2) {
        return 'Cannot remove waypoints: at least 2 waypoints (origin and destination) must remain.';
    }
    return waypoints.filter((_, i) => !unique.has(i));
};

/** Standalone execute for ToolEntry format. */
export const executeRemoveWaypointsFromRoute = async (
    params: z.infer<typeof removeWaypointsFromRouteSchema>,
    state: ToolState,
): Promise<z.infer<typeof removeWaypointsFromRouteOutputSchema>> => {
    const { waypointIndices, showOnMap, hidePreviousEntries } = params;
    try {
        const validated = validateRemoveWaypoints(state.routing.currentWaypoints, waypointIndices);
        if (typeof validated === 'string') return { error: validated };

        const waypoints = resolveRouteWaypoints(validated);
        if (!waypoints) {
            return { error: 'Not enough valid waypoints to calculate a route (minimum 2).' };
        }

        return calculateAndAddRoute(state, waypoints, showOnMap, hidePreviousEntries);
    } catch (error) {
        return {
            error: `Failed to remove waypoints from route: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
