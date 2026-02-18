/**
 * @module map-agent-tools
 */

import { bboxFromGeoJSON, type HasBBox } from '@tomtom-org/maps-sdk/core';
import { dynamicTool, type Tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../../types';

/**
 * GeoJSON bounding box schema.
 */
export const geoJsonBBoxSchema = z
    .union([
        z.array(z.number()).refine((arr) => arr.length === 4, { message: 'BBox must have 4 elements' }),
        z.array(z.number()).refine((arr) => arr.length === 6, { message: 'BBox must have 6 elements' }),
    ])
    .describe(
        'GeoJSON bounding box array [minLng, minLat, maxLng, maxLat] or [minLng, minLat, minAlt, maxLng, maxLat, maxAlt]',
    );

/**
 * HasBBox schema - either a BBox array or a GeoJSON object with bbox property.
 */
const hasBBoxSchema = z.union([geoJsonBBoxSchema, z.object({ bbox: geoJsonBBoxSchema })]);

/**
 * Tool schema for fitting bounds.
 */
export const fitBoundsSchema = z.object({
    hasBBox: hasBBoxSchema.describe(
        'A HasBBox object to fit the map to. Can be a BBox array [west, south, east, north], or a GeoJSON object with bbox property.',
    ),
    padding: z.number().optional().describe('Padding in pixels (default: 50)'),
});

/**
 * Create the fit bounds tool.
 */
export function createFitBoundsTool(context: ToolContext): Tool {
    return dynamicTool({
        description:
            'Fit the map camera to show a specific bounding box. Accepts a GeoJSON bounding box or a GeoJSON object with bbox property.',
        inputSchema: fitBoundsSchema,
        execute: async (params) => {
            const { hasBBox, padding = 50 } = params as z.infer<typeof fitBoundsSchema>;
            try {
                const bbox = bboxFromGeoJSON(hasBBox as HasBBox);

                if (!bbox) {
                    return { error: 'Invalid HasBBox object provided. Could not extract a bounding box.' };
                }

                context.map.mapLibreMap.fitBounds(bbox, { padding });

                return {
                    success: true,
                    bbox,
                };
            } catch (error) {
                return {
                    error: `Failed to fit bounds: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
