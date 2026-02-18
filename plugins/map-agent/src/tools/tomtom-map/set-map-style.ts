/**
 * @module map-agent-tools
 */

import { dynamicTool, type Tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../../types';

/**
 * Tool schema for setting map style.
 */
export const setMapStyleSchema = z.object({
    style: z
        .enum(['standardLight', 'standardDark', 'drivingLight', 'drivingDark', 'monoLight', 'monoDark', 'satellite'])
        .describe('Map visual theme'),
});

/**
 * Create the set map style tool.
 */
export function createSetMapStyleTool(context: ToolContext): Tool {
    return dynamicTool({
        description: 'Change the map visual theme',
        inputSchema: setMapStyleSchema,
        execute: async (params) => {
            const { style } = params as z.infer<typeof setMapStyleSchema>;
            try {
                context.map.ttMap.setStyle(style);

                return {
                    success: true,
                    style,
                };
            } catch (error) {
                return {
                    error: `Failed to set map style: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
