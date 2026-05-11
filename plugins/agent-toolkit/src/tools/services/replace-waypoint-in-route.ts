/**
 * @module agent-toolkit-tools
 */

import type { Place, WaypointLike } from '@tomtom-org/maps-sdk/core';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { hidePreviousEntriesSchema, locationInputSchema } from '../shared';
import { routesOutputSchema, toolErrorSchema } from '../shared-output-schemas';
import { resolveLocationInput } from './resolve-location-input';
import { calculateAndAddRoute, resolveRouteWaypoints } from './set-route';

/** Output schema for the replace-waypoint-in-route tool. */
export const replaceWaypointInRouteOutputSchema = z.union([routesOutputSchema, toolErrorSchema]);

const waypointTargetSchema = z
    .union([z.literal('origin'), z.literal('destination'), z.number().int()])
    .describe(
        "Which waypoint to overwrite. Use 'origin' or 'destination' for the endpoints, " +
            'or a 0-based absolute index (0 = origin, last = destination, intermediate stops in between).',
    );

/**
 * Tool schema for replacing a single waypoint in an existing route.
 */
export const replaceWaypointInRouteSchema = z.object({
    waypointIndex: waypointTargetSchema,
    location: locationInputSchema.describe('The new waypoint that replaces the targeted one.'),
    showOnMap: z.boolean().describe('Show the updated route and waypoints on the map after recalculation.'),
    hidePreviousEntries: hidePreviousEntriesSchema('routes'),
});

export const replaceWaypointInRouteDescription =
    'Replace a single waypoint in the current route in place — origin, destination, or any ' +
    'intermediate stop by 0-based index. Always recalculates. Other waypoints are preserved. ' +
    'Requires an existing route. Use addWaypointsToRoute to extend the route, removeWaypointsFromRoute ' +
    'to drop a waypoint, or setRoute to fully replace all waypoints.';

const resolveTargetIndex = (target: z.infer<typeof waypointTargetSchema>, waypointsLen: number): number | string => {
    if (target === 'origin') return 0;
    if (target === 'destination') return waypointsLen - 1;
    if (target < 0 || target >= waypointsLen) {
        return `Invalid waypoint index ${target}. Valid range is 0 to ${waypointsLen - 1}.`;
    }
    return target;
};

const labelForLocation = (location: z.infer<typeof locationInputSchema>): string => {
    if ('query' in location) return `"${location.query}"`;
    if ('placeId' in location) return `placeId "${location.placeId}"`;
    return JSON.stringify(location.position);
};

/** Standalone execute for ToolEntry format. */
export const executeReplaceWaypointInRoute = async (
    params: z.infer<typeof replaceWaypointInRouteSchema>,
    state: ToolState,
): Promise<z.infer<typeof replaceWaypointInRouteOutputSchema>> => {
    const { waypointIndex, location, showOnMap, hidePreviousEntries } = params;
    try {
        const current = state.routing.currentWaypoints;
        if (!current || current.length < 2) {
            return {
                error: 'No existing waypoints available. Use calculate-route first to create a route with waypoints.',
            };
        }

        const idx = resolveTargetIndex(waypointIndex, current.length);
        if (typeof idx === 'string') return { error: idx };

        const resolved = await resolveLocationInput(location, state);
        if (!resolved) {
            return { error: `Could not resolve location: ${labelForLocation(location)}` };
        }

        const updated: WaypointLike[] = [...current];
        updated[idx] = resolved.place as Place | [number, number];

        const waypoints = resolveRouteWaypoints(updated);
        if (!waypoints) {
            return { error: 'Not enough valid waypoints to calculate a route (minimum 2).' };
        }

        return calculateAndAddRoute(state, waypoints, showOnMap, hidePreviousEntries);
    } catch (error) {
        return {
            error: `Failed to replace waypoint in route: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
