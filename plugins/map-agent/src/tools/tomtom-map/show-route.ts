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
    routeIndex: z.number().optional().describe('Index of the route to display (default: 0 for main route)'),
    fitBounds: z.boolean().optional().describe('Whether to fit the map bounds to show the route. Default is true.'),
});

/**
 * Create the show route tool.
 */
export function createShowRouteTool(context: ToolContext): Tool {
    return dynamicTool({
        description: 'Display the most recent calculated route on the map',
        inputSchema: showRouteSchema,
        execute: async (params) => {
            const { routeIndex = 0, fitBounds = true } = params as z.infer<typeof showRouteSchema>;
            try {
                if (!context.services.routesHistory.length) {
                    return { error: 'No routes available to display' };
                }

                // Merge all accumulated routes
                const mergedRoutes = {
                    type: 'FeatureCollection' as const,
                    features: context.services.routesHistory.flatMap((routes) => routes.features),
                };

                const routingModule = await context.map.getRoutingModule();

                // Show all routes
                await routingModule.showRoutes(mergedRoutes, { selectedIndex: routeIndex });

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
                    displayedRoute: routeIndex,
                    totalRoutes: mergedRoutes.features.length,
                    routeCount: context.services.routesHistory.length,
                };
            } catch (error) {
                return {
                    error: `Failed to show route: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
