/**
 * @module agent-toolkit-tools
 */

import { reverseGeocode } from '@tomtom-org/maps-sdk/services';
import type { Position } from 'geojson';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { makePlacesLabel, summarizePlace } from '../../utils';
import { placeOutputSchema, toolErrorSchema } from '../shared-output-schemas';

/** Output schema for the reverse-geocode tool. */
export const reverseGeocodeOutputSchema = z.union([placeOutputSchema, toolErrorSchema]);

/**
 * Tool schema for reverse geocoding (coordinates to address).
 */
export const reverseGeocodeSchema = z.object({
    position: z.array(z.number()).length(2).describe('[longitude, latitude] GeoJSON position to reverse geocode'),
});

export const reverseGeocodeDescription =
    'Convert [lng, lat] to an address and place summary. Use after a click / getViewport / getCurrentLocation. ' +
    'Coordinates only — for text queries use locatePlace or discoverPlaces.';

/**
 * Create the reverse geocode tool.
 */
/** Standalone execute for ToolEntry format. */
export const executeReverseGeocode = async (
    params: z.infer<typeof reverseGeocodeSchema>,
    state: ToolState,
): Promise<z.infer<typeof reverseGeocodeOutputSchema>> => {
    const { position } = params;
    const pos: Position = position as Position;
    try {
        const result = await reverseGeocode({ position: pos });

        if (result) {
            state.places.addPlaceResult(result, makePlacesLabel(result));
            return summarizePlace(result);
        }

        return { error: 'No result found for the given coordinates' };
    } catch (error) {
        return {
            error: `Reverse geocoding failed: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
