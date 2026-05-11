/**
 * @module agent-toolkit-tools/maplibre
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

/** Output schema for the setPaintProperties tool. */
export const setPaintPropertiesOutputSchema = z.union([
    z.object({
        results: z.array(changeResultSchema),
    }),
    toolErrorSchema,
]);

/** Input schema for the setPaintProperties tool. */
export const setPaintPropertiesSchema = z.object({
    changes: z
        .array(
            z.object({
                layerId: z.string().describe('MapLibre layer ID from getMapStyleLayers'),
                propertyName: z.string().describe('e.g. fill-color|line-width|text-color'),
                value: z.any(),
            }),
        )
        .describe('List of paint property changes to apply in one go.'),
});

export const setPaintPropertiesDescription =
    'Set MapLibre paint properties (colors, widths, opacity) on named layers — use getMapStyleLayers for valid IDs. ' +
    'For visibility/structure use setLayoutProperties; for route styling prefer setRouteTheme.';

/** Execute function for setPaintProperties — usable with ToolEntry format. */
export const executeSetPaintProperties = async (params: z.infer<typeof setPaintPropertiesSchema>, state: ToolState) => {
    const { changes } = params;
    try {
        const results = changes.map(({ layerId, propertyName, value }) => {
            try {
                state.baseMap.mapLibreMap.setPaintProperty(layerId, propertyName, value);
                return { layerId, propertyName, value, success: true as const };
            } catch (error) {
                return {
                    layerId,
                    propertyName,
                    error: `Failed to set paint property: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        });

        return { results };
    } catch (error) {
        return {
            error: `Failed to set paint properties: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
