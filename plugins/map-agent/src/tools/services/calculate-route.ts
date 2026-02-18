/**
 * @module map-agent-tools
 */

import type { Place } from '@tomtom-org/maps-sdk/core';
import { calculateRoute, geocode, MaxNumberOfAlternatives } from '@tomtom-org/maps-sdk/services';
import { dynamicTool, type Tool } from 'ai';
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
        .describe(
            'Array of location strings (addresses or place names) to route through. Minimum 2 locations required (origin and destination). Additional locations act as intermediate waypoints.',
        ),
    alternatives: z.number().optional().describe('Number of alternative routes (0-5)'),
    clearPrevious: z.boolean().optional().describe('Clear previous routes before adding new ones (default: false)'),
});

/**
 * Create the calculate route tool.
 */
export function createCalculateRouteTool(context: ToolContext): Tool {
    return dynamicTool({
        description:
            'Calculate a driving route between locations. This is useful also to get traffic information between locations.',
        inputSchema: calculateRouteSchema,
        execute: async (params) => {
            const {
                locations,
                alternatives = 0,
                clearPrevious = false,
            } = params as z.infer<typeof calculateRouteSchema>;
            try {
                // Geocode all locations
                const geocodedPlaces: Place[] = [];

                for (const location of locations) {
                    const result = await geocode({ query: location, limit: 1 });
                    if (!result.features.length) {
                        return { error: `Could not geocode location: "${location}"` };
                    }
                    geocodedPlaces.push(result.features[0]);
                }

                // Extract waypoints
                const waypoints = geocodedPlaces.map((place) => place.geometry.coordinates as [number, number]);

                // Calculate route
                const routes = await calculateRoute({
                    locations: waypoints,
                    ...(alternatives > 0 && { maxAlternatives: alternatives as MaxNumberOfAlternatives }),
                });

                // Clear previous routes if requested
                if (clearPrevious) {
                    context.services.clearRoutesHistory();
                }

                // Accumulate routes
                context.services.addRoutes(routes);
                context.services.addWaypoints(geocodedPlaces);

                return summarizeRoutes(routes);
            } catch (error) {
                return {
                    error: `Route calculation failed: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
