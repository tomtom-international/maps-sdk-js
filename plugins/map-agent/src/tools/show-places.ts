/**
 * @module map-agent-tools
 */

import { bboxFromGeoJSON } from '@tomtom-org/maps-sdk/core';
import { PlacesModule } from '@tomtom-org/maps-sdk/map';
import { dynamicTool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../types';

/**
 * Tool schema for showing places on the map.
 */
const showPlacesSchema = z.object({});

/**
 * Create the show places tool.
 */
export function createShowPlacesTool(context: ToolContext): ReturnType<typeof dynamicTool> {
    return dynamicTool({
        description: 'Display the most recent search results as markers on the map',
        inputSchema: showPlacesSchema,
        execute: async () => {
            try {
                if (!context.state.lastSearchResults) {
                    return { error: 'No search results available to display' };
                }

                // Lazy-init PlacesModule
                if (!context.state.modules.places) {
                    context.state.modules.places = await PlacesModule.get(context.map);
                }

                // Show places
                await context.state.modules.places.show(context.state.lastSearchResults);

                // Fit bounds
                const bbox = bboxFromGeoJSON(context.state.lastSearchResults);
                if (bbox) {
                    context.map.mapLibreMap.fitBounds(bbox, { padding: 50 });
                }

                return {
                    success: true,
                    count: context.state.lastSearchResults.features.length,
                };
            } catch (error) {
                return {
                    error: `Failed to show places: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
