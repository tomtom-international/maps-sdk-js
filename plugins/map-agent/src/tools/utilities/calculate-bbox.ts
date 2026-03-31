/**
 * @module map-agent-tools
 */

import { bboxFromGeoJSON } from '@tomtom-org/maps-sdk/core';
import { type Tool, tool } from 'ai';
import { z } from 'zod';
import type { ToolState } from '../../types';

/**
 * Tool schema for calculating a bounding box from GeoJSON.
 */
export const calculateBBoxSchema = z.object({
    geoJson: z
        .union([z.record(z.string(), z.unknown()), z.array(z.record(z.string(), z.unknown()))])
        .describe('GeoJSON object or array of GeoJSON objects'),
});

export const calculateBBoxDescription =
    'Calculate a [minLng, minLat, maxLng, maxLat] bbox from GeoJSON. Context-independent. ' +
    'Returns bounding box as [minLng, minLat, maxLng, maxLat] — longitude before latitude.';

/**
 * Create the calculate bbox tool.
 */
export function createCalculateBBoxTool(_state: ToolState): Tool {
    return tool({
        description: calculateBBoxDescription,
        inputSchema: calculateBBoxSchema,
        execute: async (params) => {
            const { geoJson } = params;
            try {
                const bbox = bboxFromGeoJSON(geoJson as any);

                if (!bbox) {
                    return { error: 'Could not calculate bounding box - input may be empty or invalid GeoJSON' };
                }

                return {
                    bbox,
                    minLng: bbox[0],
                    minLat: bbox[1],
                    maxLng: bbox[2],
                    maxLat: bbox[3],
                };
            } catch (error) {
                return {
                    error: `Failed to calculate bbox: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
