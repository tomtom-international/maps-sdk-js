/**
 * @module agent-toolkit-tools
 */

import type { Place, WaypointLike } from '@tomtom-org/maps-sdk/core';
import { withInsertedWaypoints } from '@tomtom-org/maps-sdk/core';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { hidePreviousEntriesSchema, locationInputSchema } from '../shared';
import { routesOutputSchema, toolErrorSchema } from '../shared-output-schemas';
import { resolveLocationInput } from './resolve-location-input';
import { calculateAndAddRoute, resolveRouteWaypoints } from './set-route';

/** Output schema for the add-waypoints-to-route tool. */
export const addWaypointsToRouteOutputSchema = z.union([routesOutputSchema, toolErrorSchema]);

/**
 * Tool schema for adding waypoints to an existing route.
 */
export const addWaypointsToRouteSchema = z
    .object({
        origin: locationInputSchema
            .optional()
            .describe(
                'Prepend a new origin in front of the current origin. The previous origin is kept ' +
                    'as the first intermediate stop (it is not replaced).',
            ),
        destination: locationInputSchema
            .optional()
            .describe(
                'Append a new destination after the current destination. The previous destination ' +
                    'is kept as an intermediate stop (it is not replaced).',
            ),
        stops: z
            .array(locationInputSchema)
            .min(1)
            .optional()
            .describe(
                'Intermediate stops to insert at optimal mid-positions along the existing route. ' +
                    'Multiple stops settle into natural along-route order regardless of input order.',
            ),
        showOnMap: z.boolean().describe('Show the updated route and waypoints on the map after recalculation.'),
        hidePreviousEntries: hidePreviousEntriesSchema('routes'),
    })
    .refine((v) => v.origin !== undefined || v.destination !== undefined || (v.stops && v.stops.length > 0), {
        message: 'Provide at least one of `origin`, `destination`, or `stops`.',
    });

export const addWaypointsToRouteDescription =
    'Extend the current route — prepend a new origin in front of the existing one, append a new ' +
    'destination after the existing one, and/or insert intermediate stops at optimal positions along ' +
    'the existing route geometry. Existing origin/destination are preserved as intermediate stops, ' +
    'never replaced. Always recalculates. At least one of `origin`, `destination`, or `stops` MUST ' +
    'be provided. Requires an existing route. To outright replace waypoints, use setRoute instead.';

const validateExistingRoute = async (state: ToolState) => {
    // Read the currently-shown entry's module — modules are now per-entry, so
    // there's only "a route on the map" when an entry has been shown.
    const currentModule = state.routing.currentEntryModule;
    if (!currentModule) {
        return 'No existing route on the map. Use calculate-route or updateRoutesDisplay first.';
    }
    const shownRoutes = currentModule.getShown();
    const shownRouteLines = shownRoutes?.mainLines;
    const shownWaypoints = shownRoutes?.waypoints;
    if (!shownRouteLines || !shownRouteLines.features.length) {
        return 'No existing route available. Use calculate-route first.';
    }
    if (!shownWaypoints || shownWaypoints.features.length < 2) {
        return 'No existing waypoints available. Use calculate-route first to create a route with waypoints.';
    }
    return { shownRouteLines, shownWaypoints };
};

const labelForLocation = (location: z.infer<typeof locationInputSchema>): string => {
    if ('query' in location) return `"${location.query}"`;
    if ('placeId' in location) return `placeId "${location.placeId}"`;
    return JSON.stringify(location.position);
};

type ResolvedWaypoints = {
    origin?: Place | [number, number];
    destination?: Place | [number, number];
    stops: (Place | [number, number])[];
};

const resolveAllInputs = async (
    params: {
        origin?: z.infer<typeof locationInputSchema>;
        destination?: z.infer<typeof locationInputSchema>;
        stops?: z.infer<typeof locationInputSchema>[];
    },
    state: ToolState,
): Promise<ResolvedWaypoints | { error: string }> => {
    const { origin, destination, stops = [] } = params;
    const inputs = [
        ...(origin ? [{ kind: 'origin' as const, location: origin }] : []),
        ...(destination ? [{ kind: 'destination' as const, location: destination }] : []),
        ...stops.map((location) => ({ kind: 'stop' as const, location })),
    ];

    const resolved = await Promise.all(inputs.map(({ location }) => resolveLocationInput(location, state)));

    const unresolved: string[] = [];
    for (let i = 0; i < inputs.length; i++) {
        if (resolved[i] === null) unresolved.push(labelForLocation(inputs[i].location));
    }
    if (unresolved.length > 0) {
        return { error: `Could not resolve: ${unresolved.join(', ')}` };
    }

    const result: ResolvedWaypoints = { stops: [] };
    for (let i = 0; i < inputs.length; i++) {
        const place = resolved[i]?.place as Place | [number, number];
        if (inputs[i].kind === 'origin') result.origin = place;
        else if (inputs[i].kind === 'destination') result.destination = place;
        else result.stops.push(place);
    }
    return result;
};

/** Standalone execute for ToolEntry format. */
export const executeAddWaypointsToRoute = async (
    params: z.infer<typeof addWaypointsToRouteSchema>,
    state: ToolState,
): Promise<z.infer<typeof addWaypointsToRouteOutputSchema>> => {
    const { origin, destination, stops, showOnMap, hidePreviousEntries } = params;
    try {
        const routeResult = await validateExistingRoute(state);
        if (typeof routeResult === 'string') return { error: routeResult };
        const { shownRouteLines, shownWaypoints } = routeResult;

        const resolved = await resolveAllInputs({ origin, destination, stops }, state);
        if ('error' in resolved) return resolved;

        const baseWaypoints: WaypointLike[] = [
            ...(resolved.origin ? [resolved.origin] : []),
            ...shownWaypoints.features,
            ...(resolved.destination ? [resolved.destination] : []),
        ];

        const updatedWaypoints =
            resolved.stops.length > 0
                ? withInsertedWaypoints(shownRouteLines.features[0], baseWaypoints, resolved.stops)
                : baseWaypoints;

        const waypoints = resolveRouteWaypoints(updatedWaypoints);
        if (!waypoints) {
            return { error: 'Not enough valid waypoints to calculate a route (minimum 2).' };
        }

        return calculateAndAddRoute(state, waypoints, showOnMap, hidePreviousEntries);
    } catch (error) {
        return {
            error: `Failed to add waypoints to route: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
