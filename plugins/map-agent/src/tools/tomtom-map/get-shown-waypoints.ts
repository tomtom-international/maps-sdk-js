/**
 * @module map-agent-tools
 */

import { type Tool, tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../../types';

/**
 * Tool schema for getting shown waypoints on map.
 */
export const getShownWaypointsSchema = z.object({});

/**
 * Create the get shown waypoints tool.
 */
export function createGetShownWaypointsTool(context: ToolContext): Tool {
    return tool({
        description:
            'Get the route waypoints currently displayed on the map (not from service, but what is actually shown)',
        inputSchema: getShownWaypointsSchema,
        execute: async () => {
            try {
                if (!context.map.modules.routing) {
                    return { error: 'No routing module initialized - no waypoints shown on map' };
                }

                const shown = context.map.modules.routing.getShown();

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
