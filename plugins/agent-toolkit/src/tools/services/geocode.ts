/**
 * @module agent-toolkit-tools
 */

import type { WaypointLike } from '@tomtom-org/maps-sdk/core';
import { geocodeOne } from '@tomtom-org/maps-sdk/services';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { makePlacesLabel } from '../../utils/state-labels';
import { summarizePlace } from '../../utils/summarize';
import { placeOutputSchema, toolErrorSchema } from '../shared-output-schemas';

/**
 * Tool schema for geocoding (address to coordinates).
 */
export const geocodeSchema = z.object({
    query: z
        .string()
        .describe(
            'Street or postal address to geocode. Do not use for landmarks, POIs, venues, stations, cities, neighborhoods, or general place-name queries.',
        ),
    waypointIndex: z.number().int().min(0).optional().describe('0=origin, last=destination, middle=stop'),
});

/** Output schema for the geocode tool. */
export const geocodeOutputSchema = z.union([
    placeOutputSchema.extend({
        waypointIndex: z.number().optional(),
    }),
    toolErrorSchema,
]);

export const geocodeDescription =
    'Convert an explicit street or postal address to geographic coordinates without showing anything on the map. ' +
    'Use only for address-geocoding workflows. Do not use for landmarks, POIs, venues, stations, cities, neighborhoods, or general place-name queries. ' +
    'For single-place display use locatePlace with show. For route or other non-display location resolution use locatePlace. ' +
    'Optionally assigns the resolved address to a waypoint slot.';

/**
 * Create the geocode tool.
 */
/** Standalone execute for ToolEntry format. */
export async function executeGeocode(
    params: z.infer<typeof geocodeSchema>,
    state: ToolState,
): Promise<z.infer<typeof geocodeOutputSchema>> {
    const { query, waypointIndex } = params;
    try {
        const result = await geocodeOne(query);

        if (!result) {
            return { error: `No result found for "${query}"` };
        }

        state.places.addPlaceResult(result, makePlacesLabel(result, { query }));

        if (waypointIndex !== undefined) {
            state.routing.setWaypointAt(waypointIndex, result as unknown as WaypointLike);
        }

        return {
            ...summarizePlace(result),
            ...(waypointIndex !== undefined && { waypointIndex }),
        };
    } catch (error) {
        return { error: `Geocoding failed: ${error instanceof Error ? error.message : String(error)}` };
    }
}
