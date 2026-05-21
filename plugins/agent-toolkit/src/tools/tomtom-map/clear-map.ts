/**
 * @module agent-toolkit-tools
 */

import { z } from 'zod';
import { CLEARABLE_SLICE_NAMES, type ClearableMapSlice, type ClearableSliceName } from '../../state';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

// Zod's z.enum needs a non-empty literal tuple; CLEARABLE_SLICE_NAMES is typed as readonly so
// the cast just narrows it to the tuple-of-literals shape Zod expects. Order is irrelevant.
const layerEnum = z.enum(CLEARABLE_SLICE_NAMES as unknown as readonly [ClearableSliceName, ...ClearableSliceName[]]);

/** Output schema for the clear-map tool. */
export const clearMapOutputSchema = z.union([
    z.object({
        success: z.literal(true),
        cleared: z.array(layerEnum),
    }),
    toolErrorSchema,
]);

/** Tool schema for clear-map. */
export const clearMapSchema = z.object({
    layers: z
        .array(layerEnum)
        .optional()
        .describe(
            'Slice keys to clear (default: all). One per `ToolState` slice that renders on the map: ' +
                CLEARABLE_SLICE_NAMES.map((n) => `\`${n}\``).join(', ') +
                '. Map-only — slice histories (`entries`) are kept.',
        ),
});

export const clearMapDescription =
    'Hide everything a chosen set of state slices is rendering on the map (places, routing, ranges, ' +
    'customGeometries, byod, trafficAreaAnalytics, trafficIncidents). Map-only — slice `entries` history ' +
    'is untouched. Use to clean up before showing new results.';

/**
 * Execute clear map.
 */
export const executeClearMap = async (params: z.infer<typeof clearMapSchema>, state: ToolState) => {
    const { layers } = params;
    const targets = layers && layers.length > 0 ? layers : CLEARABLE_SLICE_NAMES;
    try {
        for (const name of targets) {
            // Cast widens the slice instance to the ClearableMapSlice interface — the
            // CLEARABLE_SLICE_NAMES list is `satisfies`-guarded so every name reaches a
            // slice that actually implements `clearShown`.
            await (state[name] as unknown as ClearableMapSlice).clearShown();
        }
        return {
            success: true as const,
            cleared: [...targets] as ClearableSliceName[],
        };
    } catch (error) {
        return {
            error: `Failed to clear map: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
