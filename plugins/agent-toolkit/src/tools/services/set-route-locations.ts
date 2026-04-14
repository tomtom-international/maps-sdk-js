/**
 * @module agent-toolkit-tools
 */

import { bboxFromGeoJSON, type HasBBox, type Routes, type WaypointLike } from '@tomtom-org/maps-sdk/core';
import { type CostModel, calculateRoute, type MaxNumberOfAlternatives } from '@tomtom-org/maps-sdk/services';
import type { LngLatBoundsLike } from 'maplibre-gl';
import { z } from 'zod';
import type { RouteParams, ToolState } from '../../types';
import { makeRoutesLabel, summarizeRoutes } from '../../utils';
import { locationInputSchema } from '../shared';
import { routesOutputSchema, toolErrorSchema } from '../shared-output-schemas';
import { resolveLocationInput } from './resolve-location-input';

/** Output schema for the set-route-locations tool. */
export const setRouteLocationsOutputSchema = z.union([routesOutputSchema, toolErrorSchema]);

/** Input schema for set-route-locations. */
export const setRouteLocationsSchema = z.object({
    locations: z
        .array(locationInputSchema)
        .min(2)
        .describe('Ordered list: [origin, ...stops, destination]. Minimum 2.'),
    showOnMap: z.boolean().describe('Show the route and waypoints on the map after calculation.'),
});

export const setRouteLocationsDescription =
    'Set the route waypoints by resolving location queries. ' +
    'Always triggers a route recalculation once all locations are resolved (minimum: origin + destination). ' +
    'Replaces all current waypoints. Uses route parameters from setRouteParameters if already set. ' +
    'Can be called in parallel with setRouteParameters. ' +
    'Only car/driving routes are supported.';

/**
 * Filters out null waypoints and returns the array only if there are at least 2 valid entries.
 * Returns null if the condition is not met, preventing a route calculation call.
 */
export const resolveRouteWaypoints = (waypoints: (WaypointLike | null)[]): WaypointLike[] | null => {
    const valid = waypoints.filter((w): w is WaypointLike => w !== null);
    return valid.length >= 2 ? valid : null;
};

export const buildCalculateRouteParams = (routeParams: RouteParams) => {
    const { maxAlternatives = 0, costModel, when } = routeParams;
    return {
        ...(maxAlternatives > 0 && { maxAlternatives: maxAlternatives as MaxNumberOfAlternatives }),
        ...(costModel && {
            costModel: {
                ...costModel,
                ...(costModel.avoidAreas && {
                    avoidAreas: costModel.avoidAreas as unknown as HasBBox[],
                }),
            } as CostModel,
        }),
        ...(when && { when: { option: when.option, date: new Date(when.date) } }),
    };
};

export const showRouteOnMap = async (state: ToolState, routes: Routes, waypoints: WaypointLike[]): Promise<void> => {
    const routingModule = await state.routing.getRoutingModule();
    await routingModule.showRoutes(routes);
    await routingModule.showWaypoints(waypoints);
    const bbox = bboxFromGeoJSON(routes);
    if (bbox) {
        state.baseMap.mapLibreMap.fitBounds(bbox as LngLatBoundsLike, { padding: 50 });
    }
};

/**
 * Create the set-route-locations tool.
 */
/** Standalone execute for ToolEntry format. */
export const executeSetRouteLocations = async (
    params: z.infer<typeof setRouteLocationsSchema>,
    state: ToolState,
): Promise<z.infer<typeof setRouteLocationsOutputSchema>> => {
    const { locations, showOnMap } = params;
    try {
        const resolved = await Promise.all(locations.map(resolveLocationInput));

        const unresolved = locations.filter((loc, i) => resolved[i] === null && 'query' in loc) as Array<{
            query: string;
        }>;
        if (unresolved.length > 0) {
            return { error: `Could not resolve: ${unresolved.map((l) => `"${l.query}"`).join(', ')}` };
        }

        const waypoints = resolveRouteWaypoints(resolved.map((r) => r?.place ?? null));
        if (!waypoints) {
            return { error: 'Not enough valid waypoints to calculate a route (minimum 2).' };
        }

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
            error: `Route calculation failed: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
