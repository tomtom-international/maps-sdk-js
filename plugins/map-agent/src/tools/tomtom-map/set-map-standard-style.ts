/**
 * @module map-agent-tools
 */

import { standardStyleIDs } from '@tomtom-org/maps-sdk/map';
import { type Tool, tool } from 'ai';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

/** Output schema for the setMapStandardStyle tool. */
export const setMapStandardStyleOutputSchema = z.union([
    z.object({
        success: z.literal(true),
        style: z.string(),
    }),
    toolErrorSchema,
]);

/**
 * Tool schema for setting a standard map style.
 */
export const setMapStandardStyleSchema = z.object({
    style: z.enum(standardStyleIDs).describe('Map visual theme'),
});

export const setMapStandardStyleDescription =
    'Set the map style to a standard preset (light, dark, mono, driving, satellite, etc). For detailed or incremental style tweaking use getMapStyleLayers, setLayoutProperties, and setPaintProperties.';

/**
 * Create the setMapStandardStyle tool.
 */
export function createSetMapStandardStyleTool(state: ToolState): Tool {
    return tool({
        description: setMapStandardStyleDescription,
        inputSchema: setMapStandardStyleSchema,
        outputSchema: setMapStandardStyleOutputSchema,
        execute: async (params) => {
            const { style } = params;
            try {
                state.baseMap.ttMap.setStyle(style);

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
