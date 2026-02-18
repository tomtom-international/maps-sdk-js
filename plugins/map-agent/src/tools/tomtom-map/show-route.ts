/**
 * @module map-agent-tools
 */

import { bboxFromGeoJSON } from '@tomtom-org/maps-sdk/core';
import { dynamicTool, type Tool } from 'ai';
import type { LngLatBoundsLike } from 'maplibre-gl';
import { z } from 'zod';
import type { ToolContext } from '../../types';

/**
 * Tool schema for showing routes on the map.
 */
export const showRouteSchema = z.object({
    selectedIndex: z.number().optional().describe('Index of the route to display as selected (default: 0)'),
    fitBounds: z.boolean().optional().describe('Whether to fit the map bounds to show the route. Default is true.'),
});

/**
 * Create the show route tool.
 */
export function createShowRouteTool(context: ToolContext): Tool {
    return dynamicTool({
        description: 'Display the most recent calculated routes on the map',
        inputSchema: showRouteSchema,
        execute: async (params) => {
            const { selectedIndex = 0, fitBounds = true } = params as z.infer<typeof showRouteSchema>;
            try {
                if (!context.services.routesHistory.length) {
                    return { error: 'No routes available to display' };
                }

                const routingModule = await context.map.getRoutingModule();

                const routes = context.services.lastRoutes;
                if (routes) {
                    await routingModule.showRoutes(routes, { selectedIndex });
                }

                // Show waypoints if available
                const waypoints = context.services.lastWaypoints;
                if (waypoints) {
                    await routingModule.showWaypoints(waypoints);
                }

                // Fit bounds to show all routes if requested
                if (fitBounds) {
                    const bbox = bboxFromGeoJSON(context.services.routesHistory);
                    if (bbox) {
                        context.map.mapLibreMap.fitBounds(bbox as LngLatBoundsLike, { padding: 50 });
                    }
                }

                return {
                    success: true,
                    displayedRoute: selectedIndex,
                    routeCount: routes?.features.length ?? 0,
                    totalRoutes: context.services.routesHistory.length,
                };
            } catch (error) {
                return {
                    error: `Failed to show route: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
