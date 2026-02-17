/**
 * @module map-agent-tools
 */

import { dynamicTool, type Tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../../types';

/**
 * Tool schema for getting viewport.
 */
const getViewportSchema = z.object({});

/**
 * Create the get viewport tool.
 */
export function createGetViewportTool(context: ToolContext): Tool {
    return dynamicTool({
        description: 'Get the current map viewport information',
        inputSchema: getViewportSchema,
        execute: async () => {
            try {
                const center = context.state.map.mapLibreMap.getCenter();
                const zoom = context.state.map.mapLibreMap.getZoom();
                const bbox = context.state.map.getBBox();

                return {
                    center: [center.lng, center.lat],
                    zoom,
                    bbox,
                };
            } catch (error) {
                return {
                    error: `Failed to get viewport: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
