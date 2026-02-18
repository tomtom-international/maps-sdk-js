/**
 * @module map-agent-tools
 */

import { dynamicTool, type Tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../../types';
import { summarizePlace } from '../../utils/summarize';

/**
 * Tool schema for getting last geocoded result.
 */
export const getLastGeocodedResultSchema = z.object({});

/**
 * Create the get last geocoded result tool.
 */
export function createGetLastGeocodedResultTool(context: ToolContext): Tool {
    return dynamicTool({
        description: 'Get the most recent geocoded location from the last geocode tool call',
        inputSchema: getLastGeocodedResultSchema,
        execute: async () => {
            try {
                const lastResult = context.services.lastGeocodedResult;

                if (!lastResult) {
                    return { error: 'No geocoded result available' };
                }

                return summarizePlace(lastResult);
            } catch (error) {
                return {
                    error: `Failed to get last geocoded result: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
