/**
 * @module map-agent-tools
 */

import { bboxFromGeoJSON } from '@tomtom-org/maps-sdk/core';
import { dynamicTool, type Tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../../types';

/**
 * Tool schema for showing places on the map.
 */
export const showPlacesSchema = z.object({
    fitBounds: z.boolean().optional().describe('Whether to fit the map bounds to show all places. Default is true.'),
});

/**
 * Create the show places tool.
 */
export function createShowPlacesTool(context: ToolContext): Tool {
    return dynamicTool({
        description: 'Display the most recent search results as markers on the map',
        inputSchema: showPlacesSchema,
        execute: async (params) => {
            const { fitBounds = true } = params as z.infer<typeof showPlacesSchema>;
            try {
                if (!context.state.searchResultsHistory.length) {
                    return { error: 'No search results available to display' };
                }

                // Merge all accumulated search results
                const mergedResults = {
                    type: 'FeatureCollection' as const,
                    features: context.state.searchResultsHistory.flatMap((places) => places.features),
                };

                const placesModule = await context.state.getPlacesModule();

                // Show all places
                await placesModule.show(mergedResults);

                // Fit bounds to all results if requested
                if (fitBounds) {
                    const bbox = bboxFromGeoJSON(context.state.searchResultsHistory);
                    if (bbox) {
                        context.state.map.mapLibreMap.fitBounds(bbox, { padding: 50 });
                    }
                }

                return {
                    success: true,
                    count: mergedResults.features.length,
                    searchCount: context.state.searchResultsHistory.length,
                };
            } catch (error) {
                return {
                    error: `Failed to show places: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
