/**
 * @module map-agent-tools
 */

import { dynamicTool, type Tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../../types';

/**
 * Tool schema for toggling POIs.
 */
const togglePOIsSchema = z.object({
    visible: z.boolean().describe('Whether to show or hide POI icons'),
    categories: z.array(z.string()).optional().describe('Specific POI categories to filter'),
});

/**
 * Create the toggle POIs tool.
 */
export function createTogglePOIsTool(context: ToolContext): Tool {
    return dynamicTool({
        description: 'Show or hide built-in map POI icons',
        inputSchema: togglePOIsSchema,
        execute: async (params) => {
            const { visible, categories } = params as z.infer<typeof togglePOIsSchema>;
            try {
                // Lazy-init POIsModule
                const poisModule = await context.state.getPOIsModule();

                poisModule.setVisible(visible);

                if (categories && categories.length > 0) {
                    poisModule.filterCategories({ show: categories } as any);
                }

                return {
                    success: true,
                    poisVisible: visible,
                    filteredCategories: categories,
                };
            } catch (error) {
                return {
                    error: `Failed to toggle POIs: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
