/**
 * @module map-agent-tools
 */

import { type Tool, tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../../types';

/**
 * Tool schema for getting shown places on map.
 */
export const getShownPlacesSchema = z.object({});

/**
 * Create the get shown places tool.
 */
export function createGetShownPlacesTool(context: ToolContext): Tool {
    return tool({
        description: 'Get the places currently displayed on the map (not from service, but what is actually shown)',
        inputSchema: getShownPlacesSchema,
        execute: async () => {
            try {
                if (!context.map.modules.places) {
                    return { error: 'No places module initialized - no places shown on map' };
                }

                const shown = context.map.modules.places.getShown();

                if (!shown.places || shown.places.features.length === 0) {
                    return { error: 'No places currently shown on the map' };
                }

                return {
                    count: shown.places.features.length,
                    features: shown.places.features.map((f) => ({
                        name: f.properties.name,
                        address: f.properties.address?.freeformAddress,
                        position: f.geometry.coordinates,
                    })),
                };
            } catch (error) {
                return {
                    error: `Failed to get shown places: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
