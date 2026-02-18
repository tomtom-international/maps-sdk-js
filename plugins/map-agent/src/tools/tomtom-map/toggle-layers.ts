/**
 * @module map-agent-tools
 */

import { dynamicTool, type Tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../../types';

/**
 * Tool schema for toggling layers.
 */
export const toggleLayersSchema = z.object({
    visible: z.boolean().describe('Whether to show or hide the layers'),
    layerGroups: z
        .array(z.string())
        .describe(
            'Layer group names (e.g., water, land, borders, buildings2D, buildings3D, houseNumbers, roadLines, roadLabels, roadShields, placeLabels, cityLabels, countryLabels)',
        ),
});

/**
 * Create the toggle layers tool.
 */
export function createToggleLayersTool(context: ToolContext): Tool {
    return dynamicTool({
        description: 'Show or hide specific base map layer groups',
        inputSchema: toggleLayersSchema,
        execute: async (params) => {
            const { visible, layerGroups } = params as z.infer<typeof toggleLayersSchema>;
            try {
                // Lazy-init BaseMapModule
                const baseMapModule = await context.map.getBaseMapModule();

                baseMapModule.setVisible(visible, {
                    layerGroups: {
                        mode: 'include',
                        names: layerGroups as any,
                    },
                });

                return {
                    success: true,
                    visible,
                    layerGroups,
                };
            } catch (error) {
                return {
                    error: `Failed to toggle layers: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
