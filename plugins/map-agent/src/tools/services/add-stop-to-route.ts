/**
 * @module map-agent-tools
 */

import type { Place } from '@tomtom-org/maps-sdk/core';
import { withInsertedWaypoint } from '@tomtom-org/maps-sdk/core';
import { calculateRoute, geocode, MaxNumberOfAlternatives } from '@tomtom-org/maps-sdk/services';
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
    alternatives: z.number().optional().describe('Number of alternative routes (0-5)'),
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
            const { location, alternatives = 0 } = params;
            try {
                // Check if there are existing routes
                const lastRoutes = context.services.lastRoutes;
                if (!lastRoutes || !lastRoutes.features.length) {
                    return { error: 'No existing route available. Use calculate-route first.' };
                }

                // Check if there are existing waypoints
                const lastWaypoints = context.services.lastWaypoints;
                if (!lastWaypoints || lastWaypoints.length < 2) {
                    return {
                        error: 'No existing waypoints available. Use calculate-route first to create a route with waypoints.',
                    };
                }

                // Resolve the new place: geocode if location provided, otherwise use last place from context
                let newPlace: Place;
                if (location) {
                    const result = await geocode({ query: location, limit: 1 });
                    if (!result.features.length) {
                        return { error: `Could not geocode location: "${location}"` };
                    }
                    newPlace = result.features[0];
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
                const routeToUse = lastRoutes.features[0];

                // Convert existing waypoints to WaypointLike format (coordinates)
                const existingWaypoints = lastWaypoints.map((place) => place.geometry.coordinates as [number, number]);

                // Use withInsertedWaypoint to find the best position and get updated waypoints
                const newWaypoint = newPlace.geometry.coordinates as [number, number];
                const updatedWaypoints = withInsertedWaypoint(routeToUse, existingWaypoints, newWaypoint);

                // Calculate new route with the updated waypoints
                const routes = await calculateRoute({
                    locations: updatedWaypoints,
                    ...(alternatives > 0 && { maxAlternatives: alternatives as MaxNumberOfAlternatives }),
                });

                // Update the route and waypoints history
                context.services.addRoutes(routes);

                // Create the updated waypoints array with Place objects
                const updatedWaypointsPlaces: Place[] = [];
                for (const coord of updatedWaypoints) {
                    // Find matching existing waypoint or use the new place
                    const existingPlace = lastWaypoints.find(
                        (p) => p.geometry.coordinates[0] === coord[0] && p.geometry.coordinates[1] === coord[1],
                    );
                    updatedWaypointsPlaces.push(existingPlace ?? newPlace);
                }

                context.services.addWaypoints(updatedWaypointsPlaces);

                return summarizeRoutes(routes);
            } catch (error) {
                return {
                    error: `Failed to add stop to route: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
