/**
 * @module map-agent-tools
 */

import { reverseGeocode } from '@tomtom-org/maps-sdk/services';
import { type Tool, tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../../types';
import { summarizePlace } from '../../utils/summarize';

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
export function createReverseGeocodeTool(context: ToolContext): Tool {
    return tool({
        description: 'Convert geographic coordinates to an address',
        inputSchema: reverseGeocodeSchema,
        execute: async (params) => {
            const {
                position: { longitude, latitude },
            } = params;
            const position: [number, number] = [longitude, latitude];
            try {
                const result = await reverseGeocode({ position });

                if (result) {
                    context.services.addReverseGeocodedResult(result);
                    return summarizePlace(result);
                }

                return { error: 'No result found for the given coordinates' };
            } catch (error) {
                return {
                    error: `Reverse geocoding failed: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
