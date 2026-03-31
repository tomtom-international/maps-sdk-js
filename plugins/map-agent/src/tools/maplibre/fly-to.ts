/**
 * @module map-agent-tools
 */

import { bboxFromGeoJSON, type HasBBox } from '@tomtom-org/maps-sdk/core';
import { type Tool, tool } from 'ai';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { hasBBoxSchema } from '../shared/schema';
import { toolErrorSchema } from '../shared-output-schemas';

/** Output schema for the fly-to tool. */
export const flyToOutputSchema = z.union([
    z.object({
        success: z.literal(true),
    }),
    toolErrorSchema,
]);

/** Input schema for fly-to. */
export const flyToSchema = z.object({
    where: z.union([
        z
            .object({
                boundingBox: hasBBoxSchema.describe('BBox [W,S,E,N] or GeoJSON object with bbox.'),
                padding: z.number().optional().describe('Padding in pixels. Default: 50.'),
            })
            .describe('Fit the camera to a bounding box.'),
        z
            .object({
                position: z.array(z.number()).length(2).describe('[lng, lat] to fly to.'),
                zoom: z.number().optional().describe('Camera zoom level. Default: 14.'),
            })
            .describe('Fly the camera to a specific position.'),
    ]),
});

export const flyToDescription =
    'Move the map camera to a bounding box or a specific position. ' +
    'Use with boundingBox to frame a region or set of results. Use with position to center on a point.';

/**
 * Create the fly-to tool.
 */
export function createFlyToTool(state: ToolState): Tool {
    return tool({
        description: flyToDescription,
        inputSchema: flyToSchema,
        outputSchema: flyToOutputSchema,
        execute: async (params) => {
            const { where } = params;
            try {
                if ('boundingBox' in where) {
                    const bbox = bboxFromGeoJSON(where.boundingBox as HasBBox);
                    if (!bbox) {
                        return { error: 'Invalid boundingBox — could not extract a bounding box.' };
                    }
                    state.baseMap.mapLibreMap.fitBounds(bbox, { padding: where.padding ?? 50 });
                } else {
                    state.baseMap.mapLibreMap.flyTo({
                        center: where.position as [number, number],
                        zoom: where.zoom ?? 14,
                    });
                }
                return { success: true };
            } catch (error) {
                return {
                    error: `flyTo failed: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
