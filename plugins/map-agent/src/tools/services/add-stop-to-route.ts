/**
 * @module map-agent-tools
 */

import type { Place } from '@tomtom-org/maps-sdk/core';
import { withInsertedWaypoint } from '@tomtom-org/maps-sdk/core';
import { calculateRoute, geocodeOne } from '@tomtom-org/maps-sdk/services';
import { type Tool, tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../../types';
import { summarizeRoutes } from '../../utils/summarize';

/**
 * Tool schema for adding a stop to existing route.
 */
export const addStopToRouteSchema = z.object({
    location: z
        .string()
        .optional()
        .describe(
            'Location string (address or place name) to add as a stop to the existing route. If omitted, the last calculated place from context is used.',
        ),
});

/**
 * Create the add stop to route tool.
 */
export function createAddStopToRouteTool(context: ToolContext): Tool {
    return tool({
        description:
            'Add a stop to the last shown route and re-calculate it. The stop will be inserted at the optimal position along the route. If no location is provided, the last calculated place from context is used.',
        inputSchema: addStopToRouteSchema,
        execute: async (params) => {
            const { location } = params;
            try {
                // Check if there are existing routes
                const shownRoutes = (await context.map.getRoutingModule()).getShown();
                const shownRouteLines = shownRoutes?.mainLines;
                const shownWaypoints = shownRoutes?.waypoints;
                if (!shownRouteLines || !shownRouteLines.features.length) {
                    return { error: 'No existing route available. Use calculate-route first.' };
                }

                // Check if there are existing waypoints
                if (!shownWaypoints || shownWaypoints.features.length < 2) {
                    return {
                        error: 'No existing waypoints available. Use calculate-route first to create a route with waypoints.',
                    };
                }

                // Resolve the new place: geocode if location provided, otherwise use last place from context
                let newPlace: Place;
                if (location) {
                    newPlace = await geocodeOne(location);
                    if (!newPlace) {
                        return { error: `Could not geocode location: "${location}"` };
                    }
                } else {
                    const lastPlaces = context.services.lastPlaces;
                    if (!lastPlaces) {
                        return {
                            error: 'No location provided and no last place available in context. Provide a location or search/geocode a place first.',
                        };
                    }
                    newPlace = 'features' in lastPlaces ? lastPlaces.features[0] : lastPlaces;
                }

                // Use the first route if multiple routes exist
                const routeToUse = shownRouteLines.features[0];

                // Use withInsertedWaypoint to find the best position and get updated waypoints
                const updatedWaypoints = withInsertedWaypoint(routeToUse, shownWaypoints.features, newPlace);

                // Calculate new route with the updated waypoints
                const routes = await calculateRoute({
                    locations: updatedWaypoints,
                });

                // Update the route and waypoints history
                context.services.addRoutes(routes);
                context.services.addWaypoints(updatedWaypoints);

                return summarizeRoutes(routes);
            } catch (error) {
                return {
                    error: `Failed to add stop to route: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
