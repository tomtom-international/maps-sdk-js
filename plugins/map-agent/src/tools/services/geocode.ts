/**
 * @module map-agent-tools
 */

import { geocodeOne } from '@tomtom-org/maps-sdk/services';
import { dynamicTool, type Tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../../types';
import { summarizePlace } from '../../utils/summarize';

/**
 * Tool schema for geocoding (address to coordinates).
 */
export const geocodeSchema = z.object({
    query: z.string().describe('Address or place name to geocode'),
});

/**
 * Create the geocode tool.
 */
export function createGeocodeTool(context: ToolContext): Tool {
    return dynamicTool({
        description: 'Convert an address or place name to geographic coordinates',
        inputSchema: geocodeSchema,
        execute: async (params) => {
            const { query } = params as z.infer<typeof geocodeSchema>;
            try {
                const result = await geocodeOne(query);

                if (!result) {
                    return { error: `No result found for "${query}"` };
                }

                context.state.lastGeocodeResult = result;

                return summarizePlace(result);
            } catch (error) {
                return { error: `Geocoding failed: ${error instanceof Error ? error.message : String(error)}` };
            }
        },
    });
}
