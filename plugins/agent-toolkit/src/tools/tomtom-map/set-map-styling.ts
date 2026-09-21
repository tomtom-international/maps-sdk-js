/**
 * @module agent-toolkit-tools
 */

import { type StylingKnobId, stylingKnobIds } from '@tomtom-org/maps-sdk/map';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

const knownKnobIds = stylingKnobIds.join(', ');
const knobValueSchema = z.union([z.number(), z.boolean(), z.string()]);

/** Output schema for the set-map-styling tool. */
export const setMapStylingOutputSchema = z.union([
    z.object({
        success: z.literal(true),
        /** Every knob currently overridden, after this call. */
        settings: z.record(z.string(), knobValueSchema),
        /** Knobs that were refused, with why — the rest were applied. */
        rejected: z.array(z.object({ id: z.string(), reason: z.string() })),
    }),
    toolErrorSchema,
]);

/** Tool schema for set-map-styling. */
export const setMapStylingSchema = z.object({
    set: z
        .record(z.string(), knobValueSchema)
        .optional()
        .describe(
            'Knob id → value. Factors are multipliers (1 = unchanged, e.g. 1.3), toggles are booleans, colours are CSS ' +
                `colour strings. Ranges come from describeMapStyling. Ids: ${knownKnobIds}.`,
        ),
    reset: z
        .union([z.literal(true), z.array(z.string())])
        .optional()
        .describe('true resets every knob to the style default; a list resets just those knobs. Applied before `set`.'),
});

export const setMapStylingDescription =
    'Restyle the base map semantically: label/icon/road size factors, feature toggles (exit numbers, shields, road ' +
    'arrows, 3D buildings, POI micro markers…), POI zoom and label colours, traffic congestion and incident colours. ' +
    'Durable across style switches. Not for layers the agent drew (places, routes, BYOD) — use their update*Display tools.';

/** Execute set-map-styling. */
export const executeSetMapStyling = async (params: z.infer<typeof setMapStylingSchema>, state: ToolState) => {
    try {
        const styling = await state.baseMap.getStylingModule();
        // Unknown ids and out-of-range values are the module's to refuse (with a message naming the
        // knob and its range); they are reported per knob rather than failing the whole call.
        const rejected: { id: string; reason: string }[] = [];
        const attempt = (id: string, action: () => void) => {
            try {
                action();
            } catch (error) {
                rejected.push({ id, reason: error instanceof Error ? error.message : String(error) });
            }
        };

        if (params.reset === true) {
            styling.reset();
        } else if (Array.isArray(params.reset)) {
            for (const id of params.reset) attempt(id, () => styling.reset(id as StylingKnobId));
        }
        for (const [id, value] of Object.entries(params.set ?? {})) {
            attempt(id, () => styling.set(id as StylingKnobId, value));
        }

        return { success: true as const, settings: styling.getConfig() ?? {}, rejected };
    } catch (error) {
        return {
            error: `Failed to set map styling: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
