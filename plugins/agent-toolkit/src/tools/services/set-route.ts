/**
 * @module agent-toolkit-tools
 */

import {
    type Avoidable,
    avoidableTypes,
    bboxFromGeoJSON,
    type HasBBox,
    type Routes,
    type WaypointLike,
} from '@tomtom-org/maps-sdk/core';
import {
    type CostModel,
    calculateRoute,
    type MaxNumberOfAlternatives,
    routeTypes,
} from '@tomtom-org/maps-sdk/services';
import type { LngLatBoundsLike } from 'maplibre-gl';
import { z } from 'zod';
import type { RouteParams, ToolState } from '../../types';
import { makeRoutesLabel, summarizeRoutes } from '../../utils';
import { hidePreviousEntriesSchema, hidePreviousShownEntries, locationInputSchema } from '../shared';
import { routesOutputSchema, toolErrorSchema } from '../shared-output-schemas';
import { resolveLocationInput } from './resolve-location-input';

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

export const routeParametersSchema = z.object({
    maxAlternatives: z.number().int().min(0).max(5).optional().describe('0–5, default 0'),
    costModel: costModelSchema.optional(),
    when: whenSchema.optional().describe('Omit to depart now.'),
});

/** Output schema for the set-route tool. */
export const setRouteOutputSchema = z.union([
    routesOutputSchema,
    z.object({ success: z.literal(true) }),
    toolErrorSchema,
]);

/** Input schema for set-route. */
export const setRouteSchema = z
    .object({
        locations: z
            .array(locationInputSchema)
            .min(2)
            .optional()
            .describe(
                'Ordered [origin, ...stops, destination]. Minimum 2. ' +
                    'Provide to set/replace waypoints; omit to keep the current waypoints.',
            ),
        parameters: routeParametersSchema
            .optional()
            .describe('Routing options. Omitted fields keep their current values.'),
        showOnMap: z.boolean().describe('Show the route and waypoints on the map after calculation.'),
        hidePreviousEntries: hidePreviousEntriesSchema('routes'),
    })
    .refine((v) => v.locations !== undefined || v.parameters !== undefined, {
        message: 'Provide at least one of `locations` or `parameters`.',
    });

export const setRouteDescription =
    'Calculate or recalculate a route. Provide `locations` to set/replace origin/stops/destination, ' +
    '`parameters` to update cost model / alternatives / when, or both in a single call. ' +
    'At least one of `locations` or `parameters` MUST be provided. ' +
    'If only `parameters` is given and waypoints already exist, recalculates with the new options; ' +
    'if no waypoints exist yet, parameters are stored and no recalculation runs. Car/driving only. ' +
    'Do NOT use to show, query, or modify an EXISTING displayed route — use updateRoutesDisplay / recallRoutes / ' +
    'addWaypointsToRoute / removeWaypointsFromRoute / replaceWaypointInRoute / discoverPlaces (detour|withinRoute) / getRouteProgress instead.';

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

export const showRouteOnMap = async (
    state: ToolState,
    entryId: string,
    routes: Routes,
    _waypoints: WaypointLike[],
    hidePreviousEntries?: 'all' | readonly string[],
): Promise<void> => {
    // RoutingState.showEntry handles route + waypoints rendering on the
    // entry's own RoutingModule. Under entryMode 'multiple' previously-shown
    // entries stay rendered; the optional `hidePreviousEntries` selector lets
    // callers clear them ("all") or hide specific ids before the new entry
    // is shown.
    await hidePreviousShownEntries(state.routing, [entryId], hidePreviousEntries);
    await state.routing.showEntry(entryId);
    const bbox = bboxFromGeoJSON(routes);
    if (bbox) {
        state.baseMap.mapLibreMap.fitBounds(bbox as LngLatBoundsLike, { padding: 50 });
    }
};

/**
 * Calculate a route from validated waypoints, register it in routing state,
 * optionally show it on the map, and return a summary.
 *
 * Shared by setRoute, addWaypointsToRoute, removeWaypointsFromRoute, and replaceWaypointInRoute.
 */
export const calculateAndAddRoute = async (
    state: ToolState,
    waypoints: WaypointLike[],
    showOnMap: boolean,
    hidePreviousEntries?: 'all' | readonly string[],
) => {
    const routes = await calculateRoute({
        locations: waypoints,
        ...buildCalculateRouteParams(state.routing.params),
    });

    const entryId = await state.routing.addRoutes(routes, waypoints, makeRoutesLabel(routes, waypoints));

    if (showOnMap) {
        await showRouteOnMap(state, entryId, routes, waypoints, hidePreviousEntries);
    }

    return summarizeRoutes(routes);
};

/** Standalone execute for ToolEntry format. */
export const executeSetRoute = async (
    params: z.infer<typeof setRouteSchema>,
    state: ToolState,
): Promise<z.infer<typeof setRouteOutputSchema>> => {
    const { locations, parameters, showOnMap, hidePreviousEntries } = params;
    try {
        if (parameters) state.routing.setParams(parameters);

        let waypoints: WaypointLike[] | null;
        if (locations) {
            const resolved = await Promise.all(locations.map((loc) => resolveLocationInput(loc, state)));

            const unresolved: string[] = [];
            for (let i = 0; i < locations.length; i++) {
                if (resolved[i] !== null) continue;
                const loc = locations[i];
                if ('query' in loc) unresolved.push(`"${loc.query}"`);
                else if ('placeId' in loc) unresolved.push(`placeId "${loc.placeId}"`);
            }
            if (unresolved.length > 0) {
                return { error: `Could not resolve: ${unresolved.join(', ')}` };
            }

            waypoints = resolveRouteWaypoints(resolved.map((r) => r?.place ?? null));
            if (!waypoints) {
                return { error: 'Not enough valid waypoints to calculate a route (minimum 2).' };
            }
        } else {
            waypoints = resolveRouteWaypoints(state.routing.planningSlots);
            if (!waypoints) {
                // No locations supplied and no current waypoints — params stored, nothing to calculate.
                return { success: true };
            }
        }

        return calculateAndAddRoute(state, waypoints, showOnMap, hidePreviousEntries);
    } catch (error) {
        return {
            error: `Route calculation failed: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
