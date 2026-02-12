/**
 * @module map-agent-tools
 */

import { search } from '@tomtom-org/maps-sdk/services';
import { dynamicTool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../types';
import { summarizePlaces } from '../utils/summarize';

/**
 * Tool schema for searching places.
 */
const searchPlacesSchema = z.object({
    query: z.string().describe('Search query for places, businesses, or POIs'),
    nearLongitude: z.number().optional().describe('Longitude coordinate to search near'),
    nearLatitude: z.number().optional().describe('Latitude coordinate to search near'),
    radius: z.number().optional().describe('Search radius in meters'),
    limit: z.number().optional().describe('Maximum number of results (default: 10)'),
    categories: z.array(z.string()).optional().describe('POI category filters'),
});

/**
 * Create the search places tool.
 */
export function createSearchPlacesTool(context: ToolContext): ReturnType<typeof dynamicTool> {
    return dynamicTool({
        description: 'Search for places, businesses, or points of interest',
        inputSchema: searchPlacesSchema,
        execute: async (params) => {
            const { query, nearLongitude, nearLatitude, radius, limit = 10, categories } = params as z.infer<typeof searchPlacesSchema>;
            const near = nearLongitude !== undefined && nearLatitude !== undefined 
                ? [nearLongitude, nearLatitude] as [number, number]
                : undefined;
            try {
                const result = await search({
                    query,
                    ...(near && { at: near }),
                    ...(radius && { radius }),
                    limit,
                    poiCategories: categories as any,
                });

                context.state.lastSearchResults = result;

                return summarizePlaces(result);
            } catch (error) {
                return {
                    error: `Search failed: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
