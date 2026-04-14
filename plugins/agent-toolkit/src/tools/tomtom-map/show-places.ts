/**
 * @module agent-toolkit-tools
 */

import { bboxFromGeoJSON, type Place } from '@tomtom-org/maps-sdk/core';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

/** Output schema for the show-places tool. */
export const showPlacesOutputSchema = z.union([
    z.object({
        success: z.literal(true),
        count: z.number(),
    }),
    toolErrorSchema,
]);

/**
 * Tool schema for showing places on the map.
 */
export const showPlacesSchema = z.object({
    id: z
        .string()
        .optional()
        .describe('ID of a historical places entry (from recallPlaces). Omit to show the most recent.'),
    fitBounds: z.boolean().optional().describe('default: true'),
});

export const showPlacesDescription =
    'Display search results as markers on the map. ' +
    'Pass an id (from recallPlaces) to show a historical result, or omit to show the most recent. ' +
    'Only invoke if places were not shown before.';

/**
 * Execute show places.
 */
export async function executeShowPlaces(params: z.infer<typeof showPlacesSchema>, state: ToolState) {
    const { id, fitBounds = true } = params;
    try {
        let placesToShow: Place[] | undefined;

        if (id) {
            const entry = state.places.entries.find((e) => e.id === id);
            if (!entry) {
                return { error: `No places entry found with id "${id}"` };
            }
            placesToShow = entry.data;
        } else {
            placesToShow = state.places.latestPlace;
        }

        if (!placesToShow) {
            return {
                error: 'No places available to display. Resolve a place or run a search first (e.g. discoverPlaces).',
            };
        }

        const placesModule = await state.places.getPlacesModule();

        await placesModule.show(placesToShow);

        if (fitBounds) {
            const bbox = bboxFromGeoJSON(placesToShow);
            if (bbox) {
                state.baseMap.mapLibreMap.fitBounds(bbox, { padding: 50 });
            }
        }

        return { success: true, count: placesToShow.length };
    } catch (error) {
        return {
            error: `Failed to show places: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}
