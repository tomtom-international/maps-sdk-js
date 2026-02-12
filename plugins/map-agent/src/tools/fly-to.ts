/**
 * @module map-agent-tools
 */

import { dynamicTool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../types';

/**
 * Tool schema for flying to a location.
 */
const flyToSchema = z.object({
    longitude: z.number().describe('Longitude coordinate'),
    latitude: z.number().describe('Latitude coordinate'),
    zoom: z.number().optional().describe('Zoom level (default: 14)'),
});

/**
 * Create the fly to tool.
 */
export function createFlyToTool(context: ToolContext): ReturnType<typeof dynamicTool> {
    return dynamicTool({
        description: 'Move the map camera to a specific location',
        inputSchema: flyToSchema,
        execute: async (params) => {
            const { longitude, latitude, zoom = 14 } = params as z.infer<typeof flyToSchema>;
            const center: [number, number] = [longitude, latitude];
            try {
                context.map.mapLibreMap.flyTo({
                    center,
                    zoom,
                });

                return {
                    success: true,
                    center,
                    zoom,
                };
            } catch (error) {
                return {
                    error: `Failed to fly to location: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
