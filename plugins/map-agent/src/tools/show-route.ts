/**
 * @module map-agent-tools
 */

import { bboxFromGeoJSON } from '@tomtom-org/maps-sdk/core';
import { RoutingModule } from '@tomtom-org/maps-sdk/map';
import { dynamicTool } from 'ai';
import type { LngLatBoundsLike } from 'maplibre-gl';
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
                if (!context.state.routesHistory.length) {
                    return { error: 'No routes available to display' };
                }

                // Merge all accumulated routes
                const mergedRoutes = {
                    type: 'FeatureCollection' as const,
                    features: context.state.routesHistory.flatMap((routes) => routes.features),
                };

                // Lazy-init RoutingModule
                if (!context.state.modules.routing) {
                    context.state.modules.routing = await RoutingModule.get(context.map);
                }

                // Show all routes
                await context.state.modules.routing.showRoutes(mergedRoutes, { selectedIndex: routeIndex });

                // Show waypoints if available
                if (context.state.lastWaypoints) {
                    await context.state.modules.routing.showWaypoints(context.state.lastWaypoints);
                }

                // Automatically fit bounds to show all routes
                const bbox = bboxFromGeoJSON(context.state.routesHistory);
                if (bbox) {
                    context.map.mapLibreMap.fitBounds(bbox as LngLatBoundsLike, { padding: 50 });
                }

                return {
                    success: true,
                    displayedRoute: routeIndex,
                    totalRoutes: mergedRoutes.features.length,
                    routeCount: context.state.routesHistory.length,
                };
            } catch (error) {
                return {
                    error: `Failed to show route: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
