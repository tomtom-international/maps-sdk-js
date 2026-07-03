/**
 * @module agent-toolkit-tools
 */

import { standardStyleIDs } from '@tomtom-org/maps-sdk/map';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

/** Output schema for the setMapStandardStyle tool. */
export const setMapStandardStyleOutputSchema = z.union([
    z.object({
        success: z.literal(true),
        style: z.string(),
    }),
    toolErrorSchema,
]);

/**
 * Tool schema for setting a standard map style.
 */
export const setMapStandardStyleSchema = z.object({
    style: z.enum(standardStyleIDs).describe('Map visual theme'),
});

export const setMapStandardStyleDescription =
    "Switch the map to a standard base-map style preset (IDs are the `style` argument's values). " +
    'ONLY when the user explicitly asks to change the map style/theme — never on your own initiative. ' +
    'For finer styling use getMapStyleLayers, setLayoutProperties, setPaintProperties.';

/**
 * Execute set map standard style.
 */
export const executeSetMapStandardStyle = async (
    params: z.infer<typeof setMapStandardStyleSchema>,
    state: ToolState,
) => {
    const { style } = params;
    try {
        state.baseMap.ttMap.setStyle(style);

        return {
            success: true,
            style,
        };
    } catch (error) {
        return {
            error: `Failed to set map style: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
