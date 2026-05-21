/**
 * @module agent-toolkit-tools
 */

import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

/** Output schema for the toggle-tiles-pois tool. */
export const toggleTilesPOIsOutputSchema = z.union([
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

/** Tool schema for toggle-tiles-pois. */
export const toggleTilesPOIsSchema = z.object({
    reset: z
        .boolean()
        .optional()
        .describe('Reset all tile-POI configuration to defaults. Other params ignored when true.'),
    allMapPOIsVisible: z
        .boolean()
        .optional()
        .describe('Overall visibility of the vector-tile POI icons baked into the base map style.'),
    filterCategories: z
        .object({
            show: z
                .enum(['only', 'all_except'])
                .describe('"only": keep only these categories. "all_except": hide these categories.'),
            values: z
                .array(z.string())
                .describe(
                    'MapStylePOICategory / POICategoryGroup values (e.g. "RESTAURANT", "FOOD_DRINKS_GROUP"). ' +
                        'Fine-grained codes like "ITALIAN_RESTAURANT" not supported here.',
                ),
        })
        .optional()
        .describe('Restrict which built-in vector-tile POI categories are shown.'),
});

export const toggleTilesPOIsDescription =
    'Show/hide the built-in vector-tile POI icons baked into the base map style (restaurants, hotels, gas stations, …). ' +
    'NOT the same as places shown via `discoverPlaces` / `updatePlacesDisplay` — those are session-state pins on the ' +
    'PlacesModule, untouched by this tool. `allMapPOIsVisible` toggles overall visibility; `filterCategories` restricts ' +
    'which categories show; `reset: true` restores defaults.';

/** Execute toggle-tiles-pois. */
export const executeToggleTilesPOIs = async (
    params: z.infer<typeof toggleTilesPOIsSchema>,
    state: ToolState,
): Promise<z.infer<typeof toggleTilesPOIsOutputSchema>> => {
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
            error: `Failed to toggle tile POIs: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
