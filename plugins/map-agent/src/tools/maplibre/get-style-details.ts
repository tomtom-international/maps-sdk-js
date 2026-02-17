/**
 * @module map-agent-tools
 */

import { dynamicTool, type Tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../../types';

/**
 * Tool schema for getting style.
 */
const getStyleSchema = z.object({});

/**
 * Create the get style tool.
 */
export function createGetStyleDetailsTool(context: ToolContext): Tool {
    return dynamicTool({
        description:
            'Gets the accurate layer IDs on the map along with their corresponding layout and paint properties. This tool retrieves the current style object from the MapLibre map instance, which includes all layers and their properties. It is useful for understanding the current styling of the map and for making informed decisions when doing custom updates on layer styles.',
        inputSchema: getStyleSchema,
        execute: async () => {
            try {
                const style = context.state.map.mapLibreMap.getStyle();

                return {
                    style,
                };
            } catch (error) {
                return {
                    error: `Failed to get style: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
