/**
 * @module map-agent-tools
 */

import { reverseGeocode } from '@tomtom-org/maps-sdk/services';
import { dynamicTool, type Tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../../types';

/**
 * Tool schema for reverse geocoding (coordinates to address).
 */
export const reverseGeocodeSchema = z.object({
    longitude: z.number().describe('Longitude coordinate'),
    latitude: z.number().describe('Latitude coordinate'),
});

/**
 * Create the reverse geocode tool.
 */
export function createReverseGeocodeTool(context: ToolContext): Tool {
    return dynamicTool({
        description: 'Convert geographic coordinates to an address',
        inputSchema: reverseGeocodeSchema,
        execute: async (params) => {
            const { longitude, latitude } = params as z.infer<typeof reverseGeocodeSchema>;
            const position: [number, number] = [longitude, latitude];
            try {
                const result = await reverseGeocode({ position });

                return {
                    address: result.properties.address.freeformAddress,
                    position,
                };
            } catch (error) {
                return {
                    error: `Reverse geocoding failed: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
