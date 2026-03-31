/**
 * @module map-agent-tools
 */

import { standardStyleIDs } from '@tomtom-org/maps-sdk/map';
import { type Tool, tool } from 'ai';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

/** Output schema for the get-standard-map-styles tool. */
export const getStandardMapStylesOutputSchema = z.union([
    z.object({
        styles: z.array(z.string()).readonly(),
    }),
    toolErrorSchema,
]);

/**
 * Tool schema for getting standard map styles.
 */
export const getStandardMapStylesSchema = z.object({});

export const getStandardMapStylesDescription =
    'Get the list of available standard map style IDs. If you need more fine styling control, refer to getMapStyleLayers.';

/**
 * Create the get standard map styles tool.
 */
export function createGetStandardMapStylesTool(_state: ToolState): Tool {
    return tool({
        description: getStandardMapStylesDescription,
        inputSchema: getStandardMapStylesSchema,
        outputSchema: getStandardMapStylesOutputSchema,
        execute: async (): Promise<z.infer<typeof getStandardMapStylesOutputSchema>> => {
            try {
                return {
                    styles: standardStyleIDs,
                };
            } catch (error) {
                return {
                    error: `Failed to get standard map styles: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
