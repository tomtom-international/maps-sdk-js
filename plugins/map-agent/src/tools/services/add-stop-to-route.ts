/**
 * @module map-agent-tools
 */

import type { Place } from '@tomtom-org/maps-sdk/core';
import { withInsertedWaypoint } from '@tomtom-org/maps-sdk/core';
import { calculateRoute } from '@tomtom-org/maps-sdk/services';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { makeRoutesLabel } from '../../utils/state-labels';
import { summarizeRoutes } from '../../utils/summarize';
import { locationInputSchema, resolveLocationInput } from '../shared/location-input';
import { routesOutputSchema, toolErrorSchema } from '../shared-output-schemas';
import { buildCalculateRouteParams, resolveRouteWaypoints, showRouteOnMap } from './set-route-locations';

/** Output schema for the add-stop-to-route tool. */
export const addStopToRouteOutputSchema = z.union([routesOutputSchema, toolErrorSchema]);

/**
 * Tool schema for adding a stop to existing route.
 */
export const addStopToRouteSchema = z.object({
    location: locationInputSchema.optional().describe('The stop to add. Omit to use the last stored place in context.'),
    showOnMap: z.boolean().describe('Show the updated route and waypoints on the map after recalculation.'),
});

export const addStopToRouteDescription =
    'Add a stop to the current route. Inserts the new waypoint at the optimal position and always triggers a route recalculation. ' +
    'If location is provided, it is resolved search-first. ' +
    'Requires an existing route (call setRouteLocations first).';

async function validateExistingRoute(state: ToolState) {
    const shownRoutes = (await state.routing.getRoutingModule()).getShown();
    const shownRouteLines = shownRoutes?.mainLines;
    const shownWaypoints = shownRoutes?.waypoints;
    if (!shownRouteLines || !shownRouteLines.features.length) {
        return 'No existing route available. Use calculate-route first.';
    }
    if (!shownWaypoints || shownWaypoints.features.length < 2) {
        return 'No existing waypoints available. Use calculate-route first to create a route with waypoints.';
    }
    return { shownRouteLines, shownWaypoints };
}

async function resolveNewWaypoint(
    location: z.infer<typeof locationInputSchema> | undefined,
    state: ToolState,
): Promise<{ place: Place | [number, number] } | { error: string }> {
    if (location) {
        const resolved = await resolveLocationInput(location);
        if (!resolved) {
            const label = 'query' in location ? `"${location.query}"` : JSON.stringify(location.position);
            return { error: `Could not resolve location: ${label}` };
        }
        return { place: resolved.place as Place | [number, number] };
    }
    const fallback = state.places.latestPlace?.at(0);
    if (!fallback) {
        return {
            error: 'No location provided and no last place available in context. Provide a location or resolve a place first.',
        };
    }
    return { place: fallback };
}

/**
 * Create the add stop to route tool.
 */
/** Standalone execute for ToolEntry format. */
export async function executeAddStopToRoute(
    params: z.infer<typeof addStopToRouteSchema>,
    state: ToolState,
): Promise<z.infer<typeof addStopToRouteOutputSchema>> {
    const { location, showOnMap } = params;
    try {
        const routeResult = await validateExistingRoute(state);
        if (typeof routeResult === 'string') return { error: routeResult };
        const { shownRouteLines, shownWaypoints } = routeResult;

        const waypointResult = await resolveNewWaypoint(location, state);
        if ('error' in waypointResult) return waypointResult;
        const newWaypoint = waypointResult.place;

        const routeToUse = shownRouteLines.features[0];

        // Use withInsertedWaypoint to find the best position and get updated waypoints
        const updatedWaypoints = withInsertedWaypoint(routeToUse, shownWaypoints.features, newWaypoint);

        const waypoints = resolveRouteWaypoints(updatedWaypoints);
        if (!waypoints) {
            return { error: 'Not enough valid waypoints to calculate a route (minimum 2).' };
        }

        // Calculate new route with the updated waypoints and current route params
        const routes = await calculateRoute({
            locations: waypoints,
            ...buildCalculateRouteParams(state.routing.params),
        });

        state.routing.addRoutes(routes, waypoints, makeRoutesLabel(routes, waypoints));

        if (showOnMap) {
            await showRouteOnMap(state, routes, waypoints);
        }

        return summarizeRoutes(routes);
    } catch (error) {
        return {
            error: `Failed to add stop to route: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}
