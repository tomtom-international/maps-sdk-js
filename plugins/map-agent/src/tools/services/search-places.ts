/**
 * @module map-agent-tools
 */

import { POICategory } from '@tomtom-org/maps-sdk/core';
import { search } from '@tomtom-org/maps-sdk/services';
import { type Tool, tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../../types';
import { summarizePlaces } from '../../utils/summarize';

/**
 * Tool schema for searching places.
 */
export const searchPlacesSchema = z.object({
    query: z.string().describe('Search query for places, businesses, or POIs'),
    position: z
        .array(z.number())
        .length(2)
        .optional()
        .describe('Geographic position [longitude, latitude] to bias search results near'),
    radiusMeters: z.number().optional().describe('Search radius in meters'),
    limit: z.number().optional().describe('Maximum number of results (default: 10)'),
    poiCategories: z.array(z.string()).optional().describe('POI category filters'),
});

/**
 * Create the search places tool.
 */
export function createSearchPlacesTool(context: ToolContext): Tool {
    return tool({
        description: 'Search for places, businesses, or points of interest',
        inputSchema: searchPlacesSchema,
        execute: async (params) => {
            const { query, position, radiusMeters, limit = 10, poiCategories } = params;

            try {
                const result = await search({
                    query,
                    limit,
                    poiCategories: poiCategories as POICategory[],
                    position,
                    radiusMeters,
                });

                // Accumulate search results
                context.services.addSearchResults(result);
                return summarizePlaces(result);
            } catch (error) {
                return {
                    error: `Search failed: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
