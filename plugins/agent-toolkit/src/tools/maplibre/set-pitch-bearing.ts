/**
 * @module agent-toolkit-tools
 */

import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

/** Output schema for the set-pitch-bearing tool. */
export const setPitchBearingOutputSchema = z.union([
    z.object({
        success: z.literal(true),
    }),
    toolErrorSchema,
]);

/**
 * Tool schema for setting pitch and bearing.
 */
export const setPitchBearingSchema = z.object({
    pitch: z.number().min(0).max(85).optional().describe('0=top-down, 85=near-horizontal'),
    bearing: z.number().min(-180).max(180).optional().describe('0=north, 90=east'),
});

export const setPitchBearingDescription =
    'Tilt and/or rotate the map camera. Pitch 0 = top-down view, 85 = near-horizontal (3D effect). ' +
    'Bearing 0 = north up, 90 = east up. Provide at least one of pitch or bearing.';

/** Execute function for setPitchBearing — usable with ToolEntry format. */
export async function executeSetPitchBearing(params: z.infer<typeof setPitchBearingSchema>, state: ToolState) {
    const { pitch, bearing } = params;

    if (pitch === undefined && bearing === undefined) {
        return { error: 'Provide at least one of pitch or bearing' };
    }

    try {
        const map = state.baseMap.mapLibreMap;
        map.easeTo({
            ...(pitch !== undefined && { pitch }),
            ...(bearing !== undefined && { bearing }),
        });

        return { success: true };
    } catch (error) {
        return {
            error: `Failed to set pitch/bearing: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}
