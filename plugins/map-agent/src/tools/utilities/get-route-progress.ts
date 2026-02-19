/**
 * @module map-agent-tools
 */

import {
    getCoordinateAtRouteProgress,
    type RouteCoordinateAtProgress,
    type RouteProgressQuery,
} from '@tomtom-org/maps-sdk/core';
import { type Tool, tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../../types';

const routeIndexField = z
    .number()
    .int()
    .min(0)
    .optional()
    .describe('Index of the route to query (0 = first/best route). Defaults to 0.');

/**
 * Tool schema for getting a coordinate position along a route.
 * The three progress inputs are mutually exclusive — provide exactly one.
 */
export const getRouteProgressSchema = z
    .object({
        routeIndex: routeIndexField,
        traveledTimeInSeconds: z
            .number()
            .min(0)
            .optional()
            .describe('Elapsed travel time in seconds from the route start.'),
        traveledDistanceInMeters: z
            .number()
            .min(0)
            .optional()
            .describe('Traveled distance in meters from the route start.'),
        clockTime: z
            .string()
            .optional()
            .describe(
                'Absolute clock time as an ISO 8601 string (e.g. "2025-06-01T14:30:00Z"). ' +
                    'The elapsed time is derived by subtracting the route departure time.',
            ),
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
function toRouteProgressQuery(params: z.infer<typeof getRouteProgressSchema>): RouteProgressQuery | { error: string } {
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
}

/**
 * Create the get route progress tool.
 */
export function createGetRouteProgressTool(context: ToolContext): Tool {
    return tool({
        description:
            'Return the geographic coordinates of the point along the last shown route that corresponds to a given ' +
            'progress value. Provide exactly one of: elapsed travel time in seconds (traveledTimeInSeconds), ' +
            'traveled distance in meters (traveledDistanceInMeters), or an absolute clock time as an ISO 8601 string ' +
            '(clockTime) — the elapsed time is then derived using the route departure time.',
        inputSchema: getRouteProgressSchema,
        execute: async (params) => {
            const routeIndex = params.routeIndex ?? 0;

            try {
                const lastRoutes = (await context.map.getRoutingModule()).getShown().mainLines;
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
        },
    });
}
