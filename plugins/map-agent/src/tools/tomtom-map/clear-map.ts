/**
 * @module map-agent-tools
 */

import { dynamicTool, type Tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../../types';

/**
 * Tool schema for clearing map features.
 */
const clearMapSchema = z.object({
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
                    if (context.state.modules.places) {
                        await context.state.modules.places.clear();
                    }
                    // Clear accumulated search results
                    context.state.searchResultsHistory = [];
                }

                if (clearAll || layers.includes('routes')) {
                    if (context.state.modules.routing) {
                        await context.state.modules.routing.clearRoutes();
                        await context.state.modules.routing.clearWaypoints();
                    }
                    // Clear accumulated routes
                    context.state.routesHistory = [];
                }

                if (clearAll || layers.includes('geometries')) {
                    if (context.state.modules.geometries) {
                        await context.state.modules.geometries.clear();
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
