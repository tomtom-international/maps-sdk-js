/**
 * @module map-agent-tools
 */

import { geocode } from '@tomtom-org/maps-sdk/services';
import { dynamicTool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../types';
import { summarizePlace } from '../utils/summarize';

/**
 * Tool schema for geocoding (address to coordinates).
 */
const geocodeSchema = z.object({
    query: z.string().describe('Address or place name to geocode'),
});

/**
 * Create the geocode tool.
 */
export function createGeocodeTool(context: ToolContext): ReturnType<typeof dynamicTool> {
    return dynamicTool({
        description: 'Convert an address or place name to geographic coordinates',
        inputSchema: geocodeSchema,
        execute: async (params) => {
            const { query } = params as z.infer<typeof geocodeSchema>;
            try {
                const result = await geocode({ query, limit: 1 });

                if (!result.features.length) {
                    return { error: `No results found for "${query}"` };
                }

                const place = result.features[0];
                context.state.lastGeocodeResult = place;

                return summarizePlace(place);
            } catch (error) {
                return { error: `Geocoding failed: ${error instanceof Error ? error.message : String(error)}` };
            }
        },
    });
}
