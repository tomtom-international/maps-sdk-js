/**
 * @module map-agent-tools
 */

import { reverseGeocode } from '@tomtom-org/maps-sdk/services';
import { dynamicTool, type Tool } from 'ai';
import { z } from 'zod';

/**
 * Tool schema for reverse geocoding (coordinates to address).
 */
export const reverseGeocodeSchema = z.object({
    position: z
        .object({
            longitude: z.number().describe('Longitude coordinate'),
            latitude: z.number().describe('Latitude coordinate'),
        })
        .describe('Geographic position to reverse geocode'),
});

/**
 * Create the reverse geocode tool.
 */
export function createReverseGeocodeTool(): Tool {
    return dynamicTool({
        description: 'Convert geographic coordinates to an address',
        inputSchema: reverseGeocodeSchema,
        execute: async (params) => {
            const {
                position: { longitude, latitude },
            } = params as z.infer<typeof reverseGeocodeSchema>;
            const position: [number, number] = [longitude, latitude];
            try {
                return await reverseGeocode({ position });
            } catch (error) {
                return {
                    error: `Reverse geocoding failed: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
