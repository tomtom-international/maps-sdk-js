/**
 * @module map-agent-tools
 */

import { dynamicTool, type Tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../../types';

/**
 * Tool schema for getting style.
 */
export const getStyleSchema = z.object({
    layerIdQuery: z
        .string()
        .optional()
        .describe(
            'Optional query string to filter layers by ID. Performs a case-insensitive partial match on layer IDs.',
        ),
});

/**
 * Create the get style tool.
 */
export function createGetStyleDetailsTool(context: ToolContext): Tool {
    return dynamicTool({
        description:
            'Gets the accurate layer IDs on the map along with their corresponding layout and paint properties. This tool retrieves the layers from the MapLibre map instance. You can optionally filter by layer ID or part of it. It is useful for understanding the current styling of the map and for making informed decisions when doing custom updates on layer styles.',
        inputSchema: getStyleSchema,
        execute: async (input) => {
            const { layerIdQuery } = input as z.infer<typeof getStyleSchema>;
            try {
                const style = context.map.mapLibreMap.getStyle();
                let layers = style.layers ?? [];

                // Filter by layerIdQuery if provided (case-insensitive partial match)
                if (layerIdQuery) {
                    const query = layerIdQuery.toLowerCase();
                    layers = layers.filter((layer) => layer.id.toLowerCase().includes(query));
                    if (layers.length === 0) {
                        return {
                            error: `No layers found matching query: "${layerIdQuery}"`,
                        };
                    }
                }

                return {
                    layers,
                };
            } catch (error) {
                return {
                    error: `Failed to get style: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
