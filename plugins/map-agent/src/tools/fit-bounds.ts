/**
 * @module map-agent-tools
 */

import { bboxFromGeoJSON } from '@tomtom-org/maps-sdk/core';
import { dynamicTool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../types';

/**
 * Tool schema for fitting bounds.
 */
const fitBoundsSchema = z.object({
    padding: z.number().optional().describe('Padding in pixels (default: 50)'),
});

/**
 * Create the fit bounds tool.
 */
export function createFitBoundsTool(context: ToolContext): ReturnType<typeof dynamicTool> {
    return dynamicTool({
        description: 'Fit the map camera to show all displayed data',
        inputSchema: fitBoundsSchema,
        execute: async (params) => {
            const { padding = 50 } = params as z.infer<typeof fitBoundsSchema>;
            try {
                // Collect all available data
                const bboxes = [
                    context.state.lastSearchResults && bboxFromGeoJSON(context.state.lastSearchResults),
                    context.state.lastRoutes && bboxFromGeoJSON(context.state.lastRoutes),
                ].filter((bbox): bbox is [number, number, number, number] => bbox !== undefined);

                if (bboxes.length === 0) {
                    return { error: 'No data available to fit bounds' };
                }

                // Compute combined bounding box
                const combinedBbox: [number, number, number, number] = [
                    Math.min(...bboxes.map((b) => b[0])),
                    Math.min(...bboxes.map((b) => b[1])),
                    Math.max(...bboxes.map((b) => b[2])),
                    Math.max(...bboxes.map((b) => b[3])),
                ];

                context.map.mapLibreMap.fitBounds(combinedBbox, { padding });

                return {
                    success: true,
                    bbox: combinedBbox,
                };
            } catch (error) {
                return {
                    error: `Failed to fit bounds: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
