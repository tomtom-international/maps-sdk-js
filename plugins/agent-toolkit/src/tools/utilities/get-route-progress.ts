/**
 * @module agent-toolkit-tools
 */

import {
    getCoordinateAtRouteProgress,
    type RouteCoordinateAtProgress,
    type RouteProgressQuery,
} from '@tomtom-org/maps-sdk/core';
import { z } from 'zod';
import type { ToolState } from '../../types';

const routeIndexField = z.number().int().min(0).optional().describe('default: 0');

/**
 * Tool schema for getting a coordinate position along a route.
 * The three progress inputs are mutually exclusive — provide exactly one.
 */
export const getRouteProgressSchema = z
    .object({
        routeIndex: routeIndexField,
        traveledTimeInSeconds: z.number().min(0).optional().describe('seconds from start'),
        traveledDistanceInMeters: z.number().min(0).optional().describe('meters from start'),
        clockTime: z.string().optional().describe('ISO 8601; elapsed time derived from departure time'),
    })
    .refine(
        ({ traveledTimeInSeconds, traveledDistanceInMeters, clockTime }) =>
            [traveledTimeInSeconds, traveledDistanceInMeters, clockTime].filter((v) => v !== undefined).length === 1,
        { message: 'Provide exactly one of: traveledTimeInSeconds, traveledDistanceInMeters, or clockTime.' },
    );

/**
 * Maps the tool params to a {@link RouteProgressQuery} for the core utility.
 * Returns an error string when the clockTime string is invalid.
 */
const toRouteProgressQuery = (
    params: z.infer<typeof getRouteProgressSchema>,
): RouteProgressQuery | { error: string } => {
    if (params.traveledTimeInSeconds !== undefined) {
        return { traveledTimeInSeconds: params.traveledTimeInSeconds };
    }

    if (params.traveledDistanceInMeters !== undefined) {
        return { traveledDistanceInMeters: params.traveledDistanceInMeters };
    }

    const clockTimeMs = new Date(params.clockTime as string).getTime();
    if (Number.isNaN(clockTimeMs)) {
        return { error: `Invalid clockTime value: "${params.clockTime}". Use ISO 8601 format.` };
    }

    return { clockTime: new Date(params.clockTime as string) };
};

export const getRouteProgressDescription =
    'Return the geographic coordinates of the point along the last shown route at a given traveled time (seconds), traveled distance (meters), or absolute clock time (ISO 8601). Use for route progress tracking (e.g. route-point-progress-playground example).';

/** Execute function for getRouteProgress — usable with ToolEntry format. */
export const executeGetRouteProgress = async (params: z.infer<typeof getRouteProgressSchema>, state: ToolState) => {
    const routeIndex = params.routeIndex ?? 0;

    try {
        const lastRoutes = (await state.routing.getRoutingModule()).getShown().mainLines;
        if (!lastRoutes || lastRoutes.features.length === 0) {
            return { error: 'No routes available. Use calculate-route first.' };
        }

        const route = lastRoutes.features[routeIndex];
        if (!route) {
            return {
                error: `Route index ${routeIndex} is out of range. There are ${lastRoutes.features.length} route(s) available.`,
            };
        }

        if (!route.properties.progress || route.properties.progress.length === 0) {
            return {
                error: 'The route does not contain progress data. Re-calculate the route to ensure progress data is included.',
            };
        }

        const query = toRouteProgressQuery(params);
        if ('error' in query) return query;

        const result: RouteCoordinateAtProgress | undefined = getCoordinateAtRouteProgress(route, query);

        if (result === undefined) {
            return {
                error: 'Could not interpolate a position. The progress data may be incomplete or the requested value is out of range.',
            };
        }

        return {
            longitude: result.position[0],
            latitude: result.position[1],
            travelTimeInSeconds: Math.round(result.travelTimeInSeconds),
            distanceInMeters: Math.round(result.distanceInMeters),
        };
    } catch (error) {
        return {
            error: `Failed to get route progress: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
