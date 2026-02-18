/**
 * @module map-agent-tools
 */

import { dynamicTool, type Tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../../types';

/**
 * Tool schema for clearing map features.
 */
export const clearMapSchema = z.object({
    layers: z
        .array(z.enum(['places', 'routes', 'geometries']))
        .optional()
        .describe('Layers to clear (default: all)'),
});

/**
 * Create the clear map tool.
 */
export function createClearMapTool(context: ToolContext): Tool {
    return dynamicTool({
        description: 'Remove displayed features from the map',
        inputSchema: clearMapSchema,
        execute: async (params) => {
            const { layers } = params as z.infer<typeof clearMapSchema>;
            try {
                const clearAll = !layers || layers.length === 0;

                if (clearAll || layers.includes('places')) {
                    if (context.map.modules.places) {
                        await context.map.modules.places.clear();
                    }
                    // Clear accumulated search results
                    context.services.clearSearchResultsHistory();
                }

                if (clearAll || layers.includes('routes')) {
                    if (context.map.modules.routing) {
                        await context.map.modules.routing.clearRoutes();
                        await context.map.modules.routing.clearWaypoints();
                    }
                    // Clear accumulated routes
                    context.services.clearRoutesHistory();
                    context.services.clearWaypointsHistory();
                }

                if (clearAll || layers.includes('geometries')) {
                    if (context.map.modules.geometries) {
                        await context.map.modules.geometries.clear();
                    }
                }

                return {
                    success: true,
                    cleared: layers || ['places', 'routes', 'geometries'],
                };
            } catch (error) {
                return {
                    error: `Failed to clear map: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
