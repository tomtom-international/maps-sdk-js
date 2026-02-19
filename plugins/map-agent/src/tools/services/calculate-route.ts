/**
 * @module map-agent-tools
 */

import { type Place, type WaypointLike } from '@tomtom-org/maps-sdk/core';
import { calculateRoute, geocodeOne, MaxNumberOfAlternatives } from '@tomtom-org/maps-sdk/services';
import { type Tool, tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../../types';
import { summarizeRoutes } from '../../utils/summarize';

/**
 * Tool schema for calculating routes.
 */
export const calculateRouteSchema = z.object({
    locations: z
        .array(z.string())
        .min(2)
        .optional()
        .describe(
            'Array of location strings (addresses or place names) to route through. Minimum 2 locations required (origin and destination). Additional locations act as intermediate waypoints. If omitted, the last shown waypoints from context are reused.',
        ),
    alternatives: z.number().optional().describe('Number of alternative routes (0-5)'),
    when: z
        .object({
            option: z.enum(['departAt', 'arriveBy']).describe('Whether to specify a departure or arrival time'),
            date: z
                .string()
                .describe('The date and time to depart or arrive in ISO 8601 format (e.g. "2025-10-20T08:00:00Z")'),
        })
        .optional()
        .describe('Departure or arrival time for route planning. If omitted, the route is calculated departing now.'),
});

/**
 * Create the calculate route tool.
 */
export function createCalculateRouteTool(context: ToolContext): Tool {
    return tool({
        description:
            'Calculate a driving route between locations. This is useful also to get traffic information between locations. If no locations are provided, the last shown waypoints from context are reused.',
        inputSchema: calculateRouteSchema,
        execute: async (params) => {
            const { locations, alternatives = 0, when } = params;
            try {
                let geocodedPlaces: Place[];
                let waypoints: WaypointLike[];

                if (locations) {
                    // Geocode all locations
                    geocodedPlaces = [];
                    for (const location of locations) {
                        const result = await geocodeOne(location);
                        if (!result) {
                            return { error: `Could not geocode location: "${location}"` };
                        }
                        geocodedPlaces.push(result);
                    }
                    waypoints = geocodedPlaces;
                } else {
                    // Reuse last shown waypoints from context
                    const lastWaypoints = context.services.lastWaypoints;
                    if (!lastWaypoints || lastWaypoints.length < 2) {
                        return {
                            error: 'No locations provided and no previous waypoints available in context. Provide locations or calculate a route first.',
                        };
                    }
                    waypoints = lastWaypoints;
                }

                // Calculate route
                const routes = await calculateRoute({
                    locations: waypoints,
                    ...(alternatives > 0 && { maxAlternatives: alternatives as MaxNumberOfAlternatives }),
                    ...(when && { when: { option: when.option, date: new Date(when.date) } }),
                });

                // Accumulate routes
                context.services.addRoutes(routes);
                context.services.addWaypoints(waypoints);

                return summarizeRoutes(routes);
            } catch (error) {
                return {
                    error: `Route calculation failed: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
