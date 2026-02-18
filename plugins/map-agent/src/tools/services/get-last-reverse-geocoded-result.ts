/**
 * @module map-agent-tools
 */

import { dynamicTool, type Tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../../types';
import { summarizePlace } from '../../utils/summarize';

/**
 * Tool schema for getting last reverse geocoded result.
 */
export const getLastReverseGeocodedResultSchema = z.object({});

/**
 * Create the get last reverse geocoded result tool.
 */
export function createGetLastReverseGeocodedResultTool(context: ToolContext): Tool {
    return dynamicTool({
        description: 'Get the most recent reverse geocoded address from the last reverse-geocode tool call',
        inputSchema: getLastReverseGeocodedResultSchema,
        execute: async () => {
            try {
                const lastResult = context.services.lastReverseGeocodedResult;

                if (!lastResult) {
                    return { error: 'No reverse geocoded result available' };
                }

                return summarizePlace(lastResult);
            } catch (error) {
                return {
                    error: `Failed to get last reverse geocoded result: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
