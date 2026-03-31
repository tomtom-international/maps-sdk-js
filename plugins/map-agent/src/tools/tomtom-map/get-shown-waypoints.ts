/**
 * @module map-agent-tools
 */

import { type Tool, tool } from 'ai';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

/** Output schema for the get-shown-waypoints tool. */
export const getShownWaypointsOutputSchema = z.union([
    z.object({
        count: z.number(),
        waypoints: z.array(
            z.object({
                name: z.unknown().optional(),
                position: z.array(z.number()).describe('[lng, lat]'),
            }),
        ),
    }),
    toolErrorSchema,
]);

/**
 * Tool schema for getting shown waypoints on map.
 */
export const getShownWaypointsSchema = z.object({});

export const getShownWaypointsDescription =
    'Get origin/stop/destination waypoints shown on the map. Context-dependent: requires waypoints shown on the map. ' +
    'Returns positions as [longitude, latitude].';

/**
 * Create the get shown waypoints tool.
 */
export function createGetShownWaypointsTool(state: ToolState): Tool {
    return tool({
        description: getShownWaypointsDescription,
        inputSchema: getShownWaypointsSchema,
        outputSchema: getShownWaypointsOutputSchema,
        execute: async (): Promise<z.infer<typeof getShownWaypointsOutputSchema>> => {
            try {
                const shown = (await state.routing.getRoutingModule()).getShown();

                if (!shown.waypoints || shown.waypoints.features.length === 0) {
                    return { error: 'No waypoints currently shown on the map' };
                }

                return {
                    count: shown.waypoints.features.length,
                    waypoints: shown.waypoints.features.map((w) => ({
                        name: w.properties.name,
                        position: w.geometry.coordinates,
                    })),
                };
            } catch (error) {
                return {
                    error: `Failed to get shown waypoints: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
