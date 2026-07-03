/**
 * @module agent-toolkit-tools
 */

import { bboxFromGeoJSON, type HasBBox } from '@tomtom-org/maps-sdk/core';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

/**
 * Tool schema for calculating a bounding box from GeoJSON.
 */
export const calculateBBoxSchema = z.object({
    geoJson: z
        .union([z.record(z.string(), z.unknown()), z.array(z.record(z.string(), z.unknown()))])
        .describe('GeoJSON object or array of GeoJSON objects'),
});

/** Success shape or the standardized `{ error }` failure shape. */
export const calculateBBoxOutputSchema = z.union([
    z.object({
        bbox: z.array(z.number()).length(4).describe('[minLng, minLat, maxLng, maxLat]'),
        minLng: z.number(),
        minLat: z.number(),
        maxLng: z.number(),
        maxLat: z.number(),
    }),
    toolErrorSchema,
]);

export const calculateBBoxDescription =
    'Compute a `[minLng, minLat, maxLng, maxLat]` bbox from GeoJSON (longitude before latitude).';

/** Execute function for calculateBBox — usable with ToolEntry format. */
export const executeCalculateBBox = async (params: z.infer<typeof calculateBBoxSchema>, _state: ToolState) => {
    const { geoJson } = params;
    try {
        // The schema validates `geoJson` only as a loose record/array; bridge through `unknown` to
        // hand it to bboxFromGeoJSON, which validates the actual GeoJSON shape at runtime.
        const bbox = bboxFromGeoJSON(geoJson as unknown as HasBBox);

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
};
