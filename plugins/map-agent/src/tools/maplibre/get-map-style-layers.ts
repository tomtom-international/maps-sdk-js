/**
 * @module map-agent-tools
 */

import { type Tool, tool } from 'ai';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

/** Output schema for the get-map-style-layers tool. */
export const getMapStyleLayersOutputSchema = z.union([
    z.object({
        layers: z.array(
            z.object({
                id: z.string(),
                layout: z.unknown().optional(),
                paint: z.unknown().optional(),
            }),
        ),
    }),
    toolErrorSchema,
]);

/**
 * Tool schema for getting map style layers.
 */
export const getMapStyleLayersSchema = z.object({
    layerIdQuery: z
        .string()
        .optional()
        .describe('Case-insensitive partial match on layer IDs. If omitted, all layers are returned.'),
    include: z
        .array(z.enum(['paint', 'layout']))
        .describe(
            'Which properties to include in the response. Pass only what you need: "paint" for visual properties like colors and opacity, "layout" for structural properties like sizes, positions, and visibility.',
        ),
});

export const getMapStyleLayersDescription =
    'Get map layer IDs with their paint/layout properties from MapLibre style for advanced runtime manipulation. Use before setLayoutProperty/setPaintProperty for custom styling.';

/**
 * Create the get map style layers tool.
 */
export function createGetMapStyleLayersTool(state: ToolState): Tool {
    return tool({
        description: getMapStyleLayersDescription,
        inputSchema: getMapStyleLayersSchema,
        outputSchema: getMapStyleLayersOutputSchema,
        execute: async (input): Promise<z.infer<typeof getMapStyleLayersOutputSchema>> => {
            const { layerIdQuery, include } = input;
            try {
                const style = state.baseMap.mapLibreMap.getStyle();
                let layers = style.layers ?? [];

                // Filter by layerIdQuery if provided (case-insensitive partial match)
                if (layerIdQuery) {
                    layers = layers.filter((layer) => layer.id.toLowerCase().includes(layerIdQuery.toLowerCase()));
                    if (layers.length === 0) {
                        return {
                            error: `No layers found matching query: "${layerIdQuery}"`,
                        };
                    }
                }

                return {
                    layers: layers.map((layer) => ({
                        id: layer.id,
                        ...(include.includes('paint') && { paint: layer.paint }),
                        ...(include.includes('layout') && { layout: layer.layout }),
                    })),
                };
            } catch (error) {
                return {
                    error: `Failed to get style: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
