/**
 * @module map-agent-tools
 */

import { dynamicTool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../types';

/**
 * Tool schema for getting viewport.
 */
const getViewportSchema = z.object({});

/**
 * Create the get viewport tool.
 */
export function createGetViewportTool(context: ToolContext): ReturnType<typeof dynamicTool> {
    return dynamicTool({
        description: 'Get the current map viewport information',
        inputSchema: getViewportSchema,
        execute: async () => {
            try {
                const center = context.map.mapLibreMap.getCenter();
                const zoom = context.map.mapLibreMap.getZoom();
                const bbox = context.map.getBBox();

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
