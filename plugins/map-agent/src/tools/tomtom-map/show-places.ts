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
        description: 'Display the most recent places (from search, geocode, or reverse geocode) as markers on the map',
        inputSchema: showPlacesSchema,
        execute: async (params) => {
            const { fitBounds = true } = params as z.infer<typeof showPlacesSchema>;
            try {
                const lastPlaces = context.services.lastPlaces;

                if (!lastPlaces) {
                    return { error: 'No places available to display' };
                }

                const placesModule = await context.map.getPlacesModule();

                // Show the last places (either Place or Places)
                await placesModule.show(lastPlaces);

                // Fit bounds if requested
                if (fitBounds) {
                    const bbox = bboxFromGeoJSON(lastPlaces);
                    if (bbox) {
                        context.map.mapLibreMap.fitBounds(bbox, { padding: 50 });
                    }
                }

                // Count features
                const count = 'features' in lastPlaces ? lastPlaces.features.length : 1;

                return {
                    success: true,
                    count,
                    totalPlacesInHistory: context.services.placesHistory.length,
                };
            } catch (error) {
                return {
                    error: `Failed to show places: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
