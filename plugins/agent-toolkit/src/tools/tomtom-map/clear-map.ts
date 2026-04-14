/**
 * @module agent-toolkit-tools
 */

import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

/** Output schema for the clear-map tool. */
export const clearMapOutputSchema = z.union([
    z.object({
        success: z.literal(true),
        cleared: z.array(z.string()),
    }),
    toolErrorSchema,
]);

/**
 * Tool schema for clearing map features.
 */
export const clearMapSchema = z.object({
    layers: z
        .array(z.enum(['places', 'routes', 'geometries', 'analytics']))
        .optional()
        .describe('Layers to clear (default: all). Includes traffic area analytics visualization.'),
});

export const clearMapDescription =
    'Remove displayed features from the map (places, routes, geometries, analytics). Use to clean up before showing new results or to reset the map.';

/**
 * Execute clear map.
 */
export async function executeClearMap(params: z.infer<typeof clearMapSchema>, state: ToolState) {
    const { layers } = params;
    try {
        const clearAll = !layers || layers.length === 0;

        if (clearAll || layers.includes('places')) {
            if (state.places.placesModule) {
                await state.places.placesModule.clear();
            }
        }

        if (clearAll || layers.includes('routes')) {
            if (state.routing.routingModule) {
                await state.routing.routingModule.clearRoutes();
                await state.routing.routingModule.clearWaypoints();
            }
        }

        if (clearAll || layers.includes('geometries')) {
            if (state.ranges.geometriesModule) {
                await state.ranges.geometriesModule.clear();
            }
        }

        if (clearAll || layers.includes('analytics')) {
            if (state.traffic.trafficAreaAnalyticsModule) {
                await state.traffic.trafficAreaAnalyticsModule.clear();
            }
        }

        return {
            success: true,
            cleared: layers || ['places', 'routes', 'geometries', 'analytics'],
        };
    } catch (error) {
        return {
            error: `Failed to clear map: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}
