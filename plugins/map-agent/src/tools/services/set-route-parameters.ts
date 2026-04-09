/**
 * @module map-agent-tools
 */

import { type Avoidable, avoidableTypes } from '@tomtom-org/maps-sdk/core';
import { calculateRoute, routeTypes } from '@tomtom-org/maps-sdk/services';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { makeRoutesLabel } from '../../utils/state-labels';
import { summarizeRoutes } from '../../utils/summarize';
import { routesOutputSchema, toolErrorSchema } from '../shared-output-schemas';
import { buildCalculateRouteParams, resolveRouteWaypoints, showRouteOnMap } from './set-route-locations';

export const costModelSchema = z.object({
    routeType: z.enum(routeTypes).optional().describe('fast|short|efficient|thrilling'),
    traffic: z.enum(['live', 'historical']).optional().describe('live|historical'),
    avoid: z
        .array(z.enum(avoidableTypes as unknown as [Avoidable, ...Avoidable[]]))
        .optional()
        .describe(
            'tollRoads|motorways|ferries|unpavedRoads|carpools|alreadyUsedRoads|borderCrossings|tunnels|carTrains|lowEmissionZones',
        ),
    avoidAreas: z
        .array(z.array(z.number()).describe('GeoJSON bbox [minLng, minLat, maxLng, maxLat]'))
        .max(10)
        .optional()
        .describe('Up to 10 bounding boxes to bypass.'),
});

export const whenSchema = z.object({
    option: z.enum(['departAt', 'arriveBy']),
    date: z.string().describe('ISO 8601'),
});

/** Output schema for set-route-parameters. */
export const setRouteParametersOutputSchema = z.union([
    routesOutputSchema,
    z.object({ success: z.literal(true) }),
    toolErrorSchema,
]);

/** Input schema for set-route-parameters. */
export const setRouteParametersSchema = z.object({
    maxAlternatives: z.number().int().min(0).max(5).optional().describe('0–5, default 0'),
    costModel: costModelSchema.optional(),
    when: whenSchema.optional().describe('Omit to depart now.'),
    showOnMap: z.boolean().describe('Show the route and waypoints on the map after recalculation.'),
});

export const setRouteParametersDescription =
    'Set route planning parameters: number of alternatives, cost model (route type, traffic, avoidances), and departure/arrival time. ' +
    'Triggers a route recalculation automatically if origin and destination are already set. ' +
    'Can be called in parallel with setRouteLocations. ' +
    'Only car/driving routes are supported.';

/**
 * Create the set-route-parameters tool.
 */
/** Standalone execute for ToolEntry format. */
export async function executeSetRouteParameters(
    params: z.infer<typeof setRouteParametersSchema>,
    state: ToolState,
): Promise<z.infer<typeof setRouteParametersOutputSchema>> {
    const { showOnMap, ...routeParams } = params;
    try {
        state.routing.setParams(routeParams);

        const waypoints = resolveRouteWaypoints(state.routing.planningSlots);
        if (waypoints) {
            const routes = await calculateRoute({
                locations: waypoints,
                ...buildCalculateRouteParams(state.routing.params),
            });
            state.routing.addRoutes(routes, waypoints, makeRoutesLabel(routes, waypoints));
            if (showOnMap) {
                await showRouteOnMap(state, routes, waypoints);
            }
            return summarizeRoutes(routes);
        }

        return { success: true };
    } catch (error) {
        return {
            error: `Failed to set route parameters: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}
