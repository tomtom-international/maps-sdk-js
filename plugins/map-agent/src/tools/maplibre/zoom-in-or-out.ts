/**
 * @module map-agent-tools
 */

import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

/** Output schema for the zoom-in-or-out tool. */
export const zoomInOrOutOutputSchema = z.union([
    z.object({
        zoom: z.number().describe('Resulting zoom level after the change'),
    }),
    toolErrorSchema,
]);

/** Input schema for zoom-in-or-out. */
export const zoomInOrOutSchema = z.object({
    delta: z
        .number()
        .describe(
            'Amount to zoom. Positive values zoom in, negative values zoom out. Can have decimals. Typical step: 1 or 2.',
        ),
});

export const zoomInOrOutDescription =
    'Zoom the map in or out by a given amount relative to the current zoom level. ' +
    'Positive delta zooms in (closer), negative delta zooms out (further away). ' +
    'Returns the resulting zoom level.';

/** Execute function for zoomInOrOut — usable with ToolEntry format. */
export async function executeZoomInOrOut(params: z.infer<typeof zoomInOrOutSchema>, state: ToolState) {
    const { delta } = params;
    try {
        const map = state.baseMap.mapLibreMap;
        const targetZoom = map.getZoom() + delta;
        map.zoomTo(targetZoom);
        return { zoom: targetZoom };
    } catch (error) {
        return {
            error: `Zoom failed: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}
