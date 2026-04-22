/**
 * @module agent-toolkit-tools
 */

import { bboxFromGeoJSON } from '@tomtom-org/maps-sdk/core';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

/** Output schema for the show-places tool. */
export const showPlacesOutputSchema = z.union([
    z.object({
        success: z.literal(true),
        count: z.number(),
        shownEntryIds: z.array(z.string()),
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
    fitBounds: z.boolean().optional().describe('Pan/zoom to fit the shown features. Default: true.'),
});

export const showPlacesDescription =
    'Display a places entry on the map, replacing whatever was previously shown. ' +
    'Pass an id (from recallPlaces) to show a specific entry, or omit to show the most recent. ' +
    'To stack additional entries or hide specific ones, use `managePlaces` instead.';

/**
 * Execute show places.
 */
export const executeShowPlaces = async (params: z.infer<typeof showPlacesSchema>, state: ToolState) => {
    const { id, fitBounds = true } = params;
    try {
        const targetId = id ?? state.places.entries.at(-1)?.id;

        if (!targetId) {
            return {
                error: 'No places available to display. Resolve a place or run a search first (e.g. discoverPlaces).',
            };
        }

        if (!state.places.entries.some((entry) => entry.id === targetId)) {
            return { error: `No places entry found with id "${targetId}"` };
        }

        await state.places.setShownEntries([targetId]);
        const shownFeatures = state.places.getShownFeatures();

        if (fitBounds && shownFeatures.length > 0) {
            const bbox = bboxFromGeoJSON(shownFeatures);
            if (bbox) {
                state.baseMap.mapLibreMap.fitBounds(bbox, { padding: 50 });
            }
        }

        return {
            success: true as const,
            count: shownFeatures.length,
            shownEntryIds: [...state.places.shownEntryIds],
        };
    } catch (error) {
        return {
            error: `Failed to show places: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
