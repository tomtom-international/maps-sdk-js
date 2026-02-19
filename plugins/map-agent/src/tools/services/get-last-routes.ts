/**
 * @module map-agent-tools
 */

import { type Tool, tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../../types';
import { summarizeRoutes } from '../../utils/summarize';

/**
 * Tool schema for getting last routes.
 */
export const getLastRoutesSchema = z.object({});

/**
 * Create the get last routes tool.
 */
export function createGetLastRoutesTool(context: ToolContext): Tool {
    return tool({
        description:
            'Get the most recent calculated routes from calculate-route tool. Use this to prevent re-calculating the same route.',
        inputSchema: getLastRoutesSchema,
        execute: async () => {
            try {
                const lastRoutes = context.services.lastRoutes;

                if (!lastRoutes) {
                    return { error: 'No routes available' };
                }

                return summarizeRoutes(lastRoutes);
            } catch (error) {
                return {
                    error: `Failed to get last routes: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
