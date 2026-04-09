/**
 * @module map-agent-tools
 */

import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

/** Output schema for the toggle-pois tool. */
export const togglePOIsOutputSchema = z.union([
    z.object({
        success: z.literal(true),
        allMapPOIsVisible: z.boolean().optional(),
        filterCategories: z
            .object({
                show: z.enum(['only', 'all_except']),
                values: z.array(z.string()),
            })
            .optional(),
        reset: z.boolean().optional(),
    }),
    toolErrorSchema,
]);

/**
 * Tool schema for toggling POIs.
 */
export const togglePOIsSchema = z.object({
    reset: z
        .boolean()
        .optional()
        .describe(
            'Set to true to reset all POI configuration to defaults (visibility and category filters). When true, all other parameters are ignored.',
        ),
    allMapPOIsVisible: z
        .boolean()
        .optional()
        .describe(
            'Set the overall visibility of all built-in map POI icons. True to show all POIs, false to hide all POIs.',
        ),
    filterCategories: z
        .object({
            show: z
                .enum(['only', 'all_except'])
                .describe(
                    '"only": show POIs only from the given categories. "all_except": show all POIs except those in the given categories.',
                ),
            values: z
                .array(z.string())
                .describe(
                    'MapStylePOICategory or POICategoryGroup values (e.g. "RESTAURANT", "FOOD_DRINKS_GROUP"). Overly specific codes like "ITALIAN_RESTAURANT" are not supported.',
                ),
        })
        .optional()
        .describe('Filter which built-in map POI categories are shown.'),
});

export const togglePOIsDescription =
    'Show or hide all built-in map POI icons (restaurants, hotels, gas stations, etc.) and optionally filter by category. ' +
    'Use allMapPOIsVisible to control overall POI visibility, filterCategories to restrict which categories are shown or hidden, ' +
    'or reset: true to restore all POI defaults.';

/**
 * Execute toggle POIs.
 */
export async function executeTogglePOIs(
    params: z.infer<typeof togglePOIsSchema>,
    state: ToolState,
): Promise<z.infer<typeof togglePOIsOutputSchema>> {
    try {
        const poisModule = await state.mapPOIs.getPOIsModule();

        if (params.reset) {
            poisModule.resetConfig();
            return { success: true, reset: true };
        }

        const { allMapPOIsVisible, filterCategories } = params;

        if (allMapPOIsVisible !== undefined) poisModule.setVisible(allMapPOIsVisible);
        if (filterCategories) {
            poisModule.filterCategories({ show: filterCategories.show, values: filterCategories.values });
        }

        return { success: true, allMapPOIsVisible, filterCategories };
    } catch (error) {
        return {
            error: `Failed to toggle POIs: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}
