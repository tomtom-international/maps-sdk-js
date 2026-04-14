/**
 * @module agent-toolkit-tools
 */

import { bboxFromGeoJSON, type Routes, type WaypointLike } from '@tomtom-org/maps-sdk/core';
import type { LngLatBoundsLike } from 'maplibre-gl';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

/** Output schema for the show-route tool. */
export const showRouteOutputSchema = z.union([
    z.object({
        success: z.literal(true),
        displayedRoute: z.number(),
        routeCount: z.number(),
    }),
    toolErrorSchema,
]);

/**
 * Tool schema for showing routes on the map.
 */
export const showRouteSchema = z.object({
    id: z
        .string()
        .optional()
        .describe('ID of a historical route entry (from recallRoutes). Omit to show the most recent route.'),
    selectedIndex: z.number().optional().describe('default: 0'),
    fitBounds: z.boolean().optional().describe('default: true'),
});

export const showRouteDescription =
    'Show routes and waypoints on the map and fit the camera to the route extent. ' +
    'Pass an id (from recallRoutes) to show a historical route, or omit to show the most recent. ' +
    'Mutates map display. Does not call any service.';

/**
 * Execute show routes.
 */
export const executeShowRoutes = async (params: z.infer<typeof showRouteSchema>, state: ToolState) => {
    const { id, selectedIndex = 0, fitBounds = true } = params;
    try {
        let routes: Routes | undefined;
        let waypoints: WaypointLike[] | undefined;

        if (id) {
            const entry = state.routing.entries.find((e) => e.id === id);
            if (!entry) {
                return { error: `No route entry found with id "${id}"` };
            }
            routes = entry.data;
            waypoints = entry.waypoints;
        } else {
            routes = state.routing.currentRoutes;
            waypoints = state.routing.planningSlots.filter((w): w is WaypointLike => w !== null);
        }

        if (!routes) {
            return { error: 'No routes available to display' };
        }

        const routingModule = await state.routing.getRoutingModule();
        await routingModule.showRoutes(routes, { selectedIndex });

        if (waypoints) {
            await routingModule.showWaypoints(waypoints);
        }

        // Fit bounds to show all routes if requested
        if (fitBounds) {
            const bbox = bboxFromGeoJSON(routes);
            if (bbox) {
                state.baseMap.mapLibreMap.fitBounds(bbox as LngLatBoundsLike, { padding: 50 });
            }
        }

        return {
            success: true,
            displayedRoute: selectedIndex,
            routeCount: routes.features.length,
        };
    } catch (error) {
        return {
            error: `Failed to show route: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
