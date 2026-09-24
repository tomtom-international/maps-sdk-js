/**
 * @module agent-toolkit-tools
 */

import { stylingKnobAppliesTo, stylingKnobKinds } from '@tomtom-org/maps-sdk/map';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

const knobValueSchema = z.union([z.number(), z.boolean(), z.string()]);

// The kinds and durabilities come from the SDK, so a knob kind added there cannot go missing here.
const knobKindSchema = z.enum(stylingKnobKinds);

const knobDescriptorSchema = z.object({
    id: z.string(),
    kind: knobKindSchema,
    description: z.string(),
    default: knobValueSchema.optional(),
    current: knobValueSchema.optional(),
    overridden: z.boolean(),
    range: z.object({ min: z.number(), max: z.number(), step: z.number() }).optional(),
    options: z.array(z.string()).optional(),
    available: z.boolean(),
    appliesTo: z.enum(stylingKnobAppliesTo),
});

const presetDescriptorSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    settings: z.record(z.string(), knobValueSchema),
});

/** Output schema for the describe-map-styling tool. */
export const describeMapStylingOutputSchema = z.union([
    z.object({
        knobs: z.array(knobDescriptorSchema),
        presets: z.array(presetDescriptorSchema),
    }),
    toolErrorSchema,
]);

/** Tool schema for describe-map-styling. */
export const describeMapStylingSchema = z.object({
    kind: knobKindSchema.optional().describe('Only list knobs of this kind. Omit for the whole catalogue.'),
});

export const describeMapStylingDescription =
    'List the semantic base-map styling knobs of the loaded style (label/icon/road sizes, feature toggles such as exit ' +
    'numbers or 3D buildings, POI zoom and colours, traffic congestion colours, globe projection, sky and 3D terrain) ' +
    'with kind, range, default and current value, plus the available presets. Call before setMapStyling to know valid ' +
    'ids and ranges.';

/** Execute describe-map-styling. */
export const executeDescribeMapStyling = async (params: z.infer<typeof describeMapStylingSchema>, state: ToolState) => {
    try {
        const styling = await state.baseMap.getStylingModule();
        const { knobs, presets } = styling.describe();
        return {
            knobs: params.kind ? knobs.filter((knob) => knob.kind === params.kind) : knobs,
            presets,
        };
    } catch (error) {
        return {
            error: `Failed to describe map styling: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
