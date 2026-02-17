/**
 * @module map-agent-tools
 */

import type { Place } from '@tomtom-org/maps-sdk/core';
import { calculateRoute, geocode } from '@tomtom-org/maps-sdk/services';
import { dynamicTool, type Tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../../types';
import { summarizeRoutes } from '../../utils/summarize';

/**
 * Tool schema for calculating routes.
 */
const calculateRouteSchema = z.object({
    from: z.string().describe('Starting location (address or place name)'),
    to: z.string().describe('Destination location (address or place name)'),
    via: z.array(z.string()).optional().describe('Intermediate waypoints'),
    alternatives: z.number().optional().describe('Number of alternative routes (0-5)'),
    clearPrevious: z.boolean().optional().describe('Clear previous routes before adding new ones (default: false)'),
});

/**
 * Create the calculate route tool.
 */
export function createCalculateRouteTool(context: ToolContext): Tool {
    return dynamicTool({
        description: 'Calculate a driving route between locations',
        inputSchema: calculateRouteSchema,
        execute: async (params) => {
            const {
                from,
                to,
                via = [],
                alternatives = 0,
                clearPrevious = false,
            } = params as z.infer<typeof calculateRouteSchema>;
            try {
                // Geocode all locations
                const locations: string[] = [from, ...via, to];
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
                    ...(alternatives > 0 && { maxAlternatives: alternatives as 1 | 2 | 3 | 4 | 5 }),
                });

                // Clear previous routes if requested
                if (clearPrevious) {
                    context.state.routesHistory = [];
                }

                // Accumulate routes
                context.state.routesHistory.push(routes);
                context.state.lastWaypoints = geocodedPlaces;

                return summarizeRoutes(routes);
            } catch (error) {
                return {
                    error: `Route calculation failed: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
