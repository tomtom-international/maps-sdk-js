/**
 * @module map-agent-tools
 */

import { RoutingModule } from '@tomtom-org/maps-sdk/map';
import { dynamicTool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../types';

/**
 * Tool schema for showing routes on the map.
 */
const showRouteSchema = z.object({
    routeIndex: z.number().optional().describe('Index of the route to display (default: 0 for main route)'),
});

/**
 * Create the show route tool.
 */
export function createShowRouteTool(context: ToolContext): ReturnType<typeof dynamicTool> {
    return dynamicTool({
        description: 'Display the most recent calculated route on the map',
        inputSchema: showRouteSchema,
        execute: async (params) => {
            const { routeIndex = 0 } = params as z.infer<typeof showRouteSchema>;
            try {
                if (!context.state.lastRoutes) {
                    return { error: 'No routes available to display' };
                }

                // Lazy-init RoutingModule
                if (!context.state.modules.routing) {
                    context.state.modules.routing = await RoutingModule.get(context.map);
                }

                // Show routes
                await context.state.modules.routing.showRoutes(context.state.lastRoutes);

                // Show waypoints if available
                if (context.state.lastWaypoints) {
                    await context.state.modules.routing.showWaypoints(context.state.lastWaypoints);
                }

                return {
                    success: true,
                    displayedRoute: routeIndex,
                    totalRoutes: context.state.lastRoutes.features.length,
                };
            } catch (error) {
                return {
                    error: `Failed to show route: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
