/**
 * @module map-agent-tools
 */

import { dynamicTool, type Tool } from 'ai';
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
    return dynamicTool({
        description: 'Get the most recent routes from the last route calculation service call',
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
