/**
 * @module map-agent-tools
 */

import { dynamicTool, type Tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../../types';
import { summarizePlaces } from '../../utils/summarize';

/**
 * Tool schema for getting last search results.
 */
export const getLastSearchResultsSchema = z.object({});

/**
 * Create the get last search results tool.
 */
export function createGetLastSearchResultsTool(context: ToolContext): Tool {
    return dynamicTool({
        description: 'Get the most recent search results from the last search service call',
        inputSchema: getLastSearchResultsSchema,
        execute: async () => {
            try {
                const lastResults = context.services.lastSearchResults;

                if (!lastResults) {
                    return { error: 'No search results available' };
                }

                return summarizePlaces(lastResults);
            } catch (error) {
                return {
                    error: `Failed to get last search results: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
