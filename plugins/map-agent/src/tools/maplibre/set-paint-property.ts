/**
 * @module map-agent-tools/maplibre
 */

import { dynamicTool, type Tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../../types';

/**
 * Tool schema for setting paint property.
 */
const setPaintPropertySchema = z.object({
    layerId: z.string().describe('The ID of the layer to update'),
    propertyName: z
        .string()
        .describe('The name of the paint property to set (e.g., "fill-color", "line-width", "text-color")'),
    value: z.any().describe('The value to set for the paint property'),
});

/**
 * Create the set paint property tool.
 */
export function createSetPaintPropertyTool(context: ToolContext): Tool {
    return dynamicTool({
        description:
            'Set a paint property for a specific layer in the MapLibre style. Paint properties control the visual appearance of features (e.g., fill-color, line-width, text-color, circle-radius).',
        inputSchema: setPaintPropertySchema,
        execute: async (params) => {
            const { layerId, propertyName, value } = params as z.infer<typeof setPaintPropertySchema>;
            try {
                context.state.map.mapLibreMap.setPaintProperty(layerId, propertyName, value);

                return {
                    success: true,
                    layerId,
                    propertyName,
                    value,
                    message: `Successfully set paint property '${propertyName}' to '${JSON.stringify(value)}' for layer '${layerId}'`,
                };
            } catch (error) {
                return {
                    error: `Failed to set paint property: ${error instanceof Error ? error.message : String(error)}`,
                    layerId,
                    propertyName,
                };
            }
        },
    });
}
