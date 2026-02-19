/**
 * @module map-agent-tools
 */

import { calculateRoute } from '@tomtom-org/maps-sdk/services';
import { type Tool, tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../../types';
import { summarizeRoutes } from '../../utils/summarize';

/**
 * Tool schema for removing a stop from an existing route.
 */
export const removeStopFromRouteSchema = z.object({
    stopIndex: z
        .number()
        .int()
        .describe(
            'Zero-based index of the waypoint to remove (0 = origin, last = destination, intermediate values = stops in between). At least 2 waypoints must remain after removal.',
        ),
});

/**
 * Create the remove stop from route tool.
 */
export function createRemoveStopFromRouteTool(context: ToolContext): Tool {
    return tool({
        description:
            'Remove a stop from the last calculated route by its index and re-calculate it. Index 0 is the origin, the last index is the destination, and intermediate values are stops in between.',
        inputSchema: removeStopFromRouteSchema,
        execute: async (params) => {
            const { stopIndex } = params;
            try {
                const lastWaypoints = context.services.lastWaypoints;
                if (!lastWaypoints || lastWaypoints.length < 2) {
                    return {
                        error: 'No existing waypoints available. Use calculate-route first to create a route with waypoints.',
                    };
                }

                if (stopIndex < 0 || stopIndex >= lastWaypoints.length) {
                    return {
                        error: `Invalid stop index ${stopIndex}. Valid range is 0 to ${lastWaypoints.length - 1}.`,
                    };
                }

                if (lastWaypoints.length <= 2) {
                    return {
                        error: 'Cannot remove a stop: at least 2 waypoints (origin and destination) must remain.',
                    };
                }

                const updatedWaypointsPlaces = lastWaypoints.filter((_, i) => i !== stopIndex);

                const routes = await calculateRoute({
                    locations: updatedWaypointsPlaces,
                });

                context.services.addRoutes(routes);
                context.services.addWaypoints(updatedWaypointsPlaces);

                return summarizeRoutes(routes);
            } catch (error) {
                return {
                    error: `Failed to remove stop from route: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
