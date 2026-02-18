/**
 * @module map-agent-tools
 */

import { dynamicTool, type Tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../../types';
import { summarizePlace, summarizePlaces } from '../../utils/summarize';

/**
 * Tool schema for getting last places.
 */
export const getLastPlacesSchema = z.object({});

/**
 * Create the get last places tool.
 */
export function createGetLastPlacesTool(context: ToolContext): Tool {
    return dynamicTool({
        description: 'Get the most recent places from the last search-places, geocode, or reverse-geocode tool call',
        inputSchema: getLastPlacesSchema,
        execute: async () => {
            try {
                const lastPlaces = context.services.lastPlaces;

                if (!lastPlaces) {
                    return { error: 'No places available' };
                }

                // Check if it's a Places collection or single Place
                if ('features' in lastPlaces) {
                    return summarizePlaces(lastPlaces);
                } else {
                    return summarizePlace(lastPlaces);
                }
            } catch (error) {
                return {
                    error: `Failed to get last places: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
