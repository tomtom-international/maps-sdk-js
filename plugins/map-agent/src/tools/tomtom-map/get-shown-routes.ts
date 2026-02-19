/**
 * @module map-agent-tools
 */

import { type Tool, tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../../types';
import { summarizeRoutes } from '../../utils/summarize';

/**
 * Tool schema for getting shown routes on map.
 */
export const getShownRoutesSchema = z.object({});

/**
 * Create the get shown routes tool.
 */
export function createGetShownRoutesTool(context: ToolContext): Tool {
    return tool({
        description:
            'Get the routes currently displayed on the map (not from service, but what is actually shown from show-route tool)',
        inputSchema: getShownRoutesSchema,
        execute: async () => {
            try {
                if (!context.map.modules.routing) {
                    return { error: 'No routing module initialized - no routes shown on map' };
                }

                const shown = context.map.modules.routing.getShown();

                if (!shown.mainLines || shown.mainLines.features.length === 0) {
                    return { error: 'No routes currently shown on the map' };
                }

                return summarizeRoutes(shown.mainLines);
            } catch (error) {
                return {
                    error: `Failed to get shown routes: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
