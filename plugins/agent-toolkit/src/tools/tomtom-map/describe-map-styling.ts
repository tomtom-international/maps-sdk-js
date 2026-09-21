/**
 * @module agent-toolkit-tools
 */

import { stylingKnobAppliesTo, stylingKnobKinds } from '@tomtom-org/maps-sdk/map';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

// The kinds and the applies-to values come from the SDK, so a knob kind added there (the `enum`
// kind, say) cannot go missing from this tool's schema.
const knobKindSchema = z.enum(stylingKnobKinds);

const knobDescriptorSchema = z.object({
    id: z.string(),
    kind: knobKindSchema,
    description: z.string(),
    default: z.union([z.number(), z.boolean(), z.string()]).optional(),
    current: z.union([z.number(), z.boolean(), z.string()]).optional(),
    overridden: z.boolean(),
    range: z.object({ min: z.number(), max: z.number(), step: z.number() }).optional(),
    available: z.boolean(),
    appliesTo: z.enum(stylingKnobAppliesTo),
});

/** Output schema for the describe-map-styling tool. */
export const describeMapStylingOutputSchema = z.union([
    z.object({
        knobs: z.array(knobDescriptorSchema),
    }),
    toolErrorSchema,
]);

/** Tool schema for describe-map-styling. */
export const describeMapStylingSchema = z.object({
    kind: knobKindSchema.optional().describe('Only list knobs of this kind. Omit for the whole catalogue.'),
});

export const describeMapStylingDescription =
    'List the semantic base-map styling knobs of the loaded style (label/icon/road sizes, feature toggles such as exit ' +
    'numbers or 3D buildings, POI zoom and colours, traffic congestion colours) with kind, range, default and current ' +
    'value. Call before setMapStyling to know valid ids and ranges.';

/** Execute describe-map-styling. */
export const executeDescribeMapStyling = async (params: z.infer<typeof describeMapStylingSchema>, state: ToolState) => {
    try {
        const styling = await state.baseMap.getStylingModule();
        const { knobs } = styling.describe();
        return {
            knobs: params.kind ? knobs.filter((knob) => knob.kind === params.kind) : knobs,
        };
    } catch (error) {
        return {
            error: `Failed to describe map styling: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
