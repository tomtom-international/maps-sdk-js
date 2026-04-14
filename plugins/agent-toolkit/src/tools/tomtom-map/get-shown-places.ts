/**
 * @module agent-toolkit-tools
 */

import type { Place } from '@tomtom-org/maps-sdk/core';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

/** Output schema for the get-shown-places tool. */
export const getShownPlacesOutputSchema = z.union([
    z.object({
        count: z.number(),
        features: z.array(
            z.object({
                name: z.string().optional(),
                address: z.string().optional(),
                position: z.array(z.number()).describe('[lng, lat]'),
            }),
        ),
    }),
    toolErrorSchema,
]);

/**
 * Tool schema for getting shown places on map.
 */
export const getShownPlacesSchema = z.object({});

export const getShownPlacesDescription =
    'Get place markers currently shown on the map. Context-dependent: requires places shown on the map. ' +
    'Positions are [longitude, latitude]. ' +
    'Reads rendered map state (not plugin service history). Returns places currently visible on map — use after showPlaces or locatePlace.';

/**
 * Execute get shown places.
 */
export async function executeGetShownPlaces(_params: z.infer<typeof getShownPlacesSchema>, state: ToolState) {
    try {
        if (!state.places.placesModule) {
            return { count: 0, features: [] };
        }

        const shown = state.places.placesModule.getShown();

        if (!shown.places || shown.places.features.length === 0) {
            return { count: 0, features: [] };
        }

        return {
            count: shown.places.features.length,
            features: shown.places.features.map((f: Place) => ({
                name: f.properties.poi?.name,
                address: f.properties.address?.freeformAddress,
                position: f.geometry.coordinates,
            })),
        };
    } catch (error) {
        return {
            error: `Failed to get shown places: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}
