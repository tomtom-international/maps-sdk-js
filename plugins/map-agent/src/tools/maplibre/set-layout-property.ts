/**
 * @module map-agent-tools/maplibre
 */

import { dynamicTool, type Tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../../types';

/**
 * Tool schema for setting layout property.
 */
export const setLayoutPropertySchema = z.object({
    layerId: z.string().describe('The ID of the layer to update'),
    propertyName: z
        .string()
        .describe('The name of the layout property to set (e.g., "visibility", "text-field", "icon-size")'),
    value: z.any().describe('The value to set for the layout property'),
});

/**
 * Create the set layout property tool.
 */
export function createSetLayoutPropertyTool(context: ToolContext): Tool {
    return dynamicTool({
        description:
            'Set a layout property for a specific layer in the MapLibre style. Layout properties control how features in a layer are arranged on the map (e.g., visibility, text-field, icon-size, text-anchor).',
        inputSchema: setLayoutPropertySchema,
        execute: async (params) => {
            const { layerId, propertyName, value } = params as z.infer<typeof setLayoutPropertySchema>;
            try {
                context.map.mapLibreMap.setLayoutProperty(layerId, propertyName, value);

                return {
                    success: true,
                    layerId,
                    propertyName,
                    value,
                    message: `Successfully set layout property '${propertyName}' to '${JSON.stringify(value)}' for layer '${layerId}'`,
                };
            } catch (error) {
                return {
                    error: `Failed to set layout property: ${error instanceof Error ? error.message : String(error)}`,
                    layerId,
                    propertyName,
                };
            }
        },
    });
}
