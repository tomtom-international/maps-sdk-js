/**
 * @module map-agent-tools/maplibre
 */

import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

const changeResultSchema = z.union([
    z.object({
        layerId: z.string(),
        propertyName: z.string(),
        value: z.unknown(),
        success: z.literal(true),
    }),
    z.object({
        layerId: z.string(),
        propertyName: z.string(),
        error: z.string(),
    }),
]);

/** Output schema for the setLayoutProperties tool. */
export const setLayoutPropertiesOutputSchema = z.union([
    z.object({
        results: z.array(changeResultSchema),
    }),
    toolErrorSchema,
]);

/** Input schema for the setLayoutProperties tool. */
export const setLayoutPropertiesSchema = z
    .object({
        changes: z.array(
            z.object({
                layerId: z.string().describe('MapLibre layer ID from getMapStyleLayers'),
                propertyName: z.string().describe('e.g. visibility|text-field|icon-size'),
                value: z.any(),
            }),
        ),
    })
    .describe('List of layout property changes to apply in one go.');

export const setLayoutPropertiesDescription =
    'Set one or more layout properties on MapLibre layers (visibility, text-field, icon-size). ' +
    'Use getMapStyleLayers to discover valid layer IDs first. ' +
    'Layout properties control structure and visibility — use setPaintProperties for colors and widths.';

/** Execute function for setLayoutProperties — usable with ToolEntry format. */
export async function executeSetLayoutProperties(params: z.infer<typeof setLayoutPropertiesSchema>, state: ToolState) {
    const { changes } = params;
    try {
        const results = changes.map(({ layerId, propertyName, value }) => {
            try {
                state.baseMap.mapLibreMap.setLayoutProperty(layerId, propertyName, value);
                return { layerId, propertyName, value, success: true as const };
            } catch (error) {
                return {
                    layerId,
                    propertyName,
                    error: `Failed to set layout property: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        });

        return { results };
    } catch (error) {
        return {
            error: `Failed to set layout properties: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}
