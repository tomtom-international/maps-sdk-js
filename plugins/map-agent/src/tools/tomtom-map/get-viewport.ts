/**
 * @module map-agent-tools
 */

import { type Tool, tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../../types';

/**
 * Tool schema for getting viewport.
 */
export const getViewportSchema = z.object({});

/**
 * Create the get viewport tool.
 */
export function createGetViewportTool(context: ToolContext): Tool {
    return tool({
        description:
            'Get the current map viewport information including center coordinates, zoom level, and bounding box.',
        inputSchema: getViewportSchema,
        execute: async () => {
            try {
                return {
                    center: context.map.mapLibreMap.getCenter().toArray(),
                    zoom: context.map.mapLibreMap.getZoom(),
                    bbox: context.map.ttMap.getBBox(),
                };
            } catch (error) {
                return {
                    error: `Failed to get viewport: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
