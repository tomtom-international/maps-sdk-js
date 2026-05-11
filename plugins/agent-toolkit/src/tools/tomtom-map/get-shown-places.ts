/**
 * @module agent-toolkit-tools
 */

import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

/** Output schema for the get-shown-places tool. */
export const getShownPlacesOutputSchema = z.union([
    z.object({
        count: z.number().describe('Total feature count across all shown entries.'),
        entries: z.array(
            z.object({
                id: z.string(),
                label: z.string(),
                featureCount: z.number(),
                markerType: z.enum(['pin', 'base-map']).describe('How the entry is rendered on the map.'),
                features: z.array(
                    z.object({
                        name: z.string().optional(),
                        address: z.string().optional(),
                        position: z.array(z.number()).describe('[lng, lat]'),
                    }),
                ),
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
    'List the place entries currently shown on the map, grouped by `placesEntryId` with labels and a feature preview. ' +
    'Use to check which categories are visible before calling `updatePlacesDisplay`, or when the user asks "what is on the map". ' +
    'Positions are [longitude, latitude].';

const FEATURE_PREVIEW_SIZE = 5;

/**
 * Execute get shown places.
 */
export const executeGetShownPlaces = async (_params: z.infer<typeof getShownPlacesSchema>, state: ToolState) => {
    try {
        const shownIds = state.places.shownEntryIds;
        if (shownIds.size === 0) {
            return { count: 0, entries: [] };
        }

        const entries = state.places.entries
            .filter((entry) => shownIds.has(entry.id))
            .map((entry) => ({
                id: entry.id,
                label: entry.label,
                featureCount: entry.places.length,
                markerType: state.places.getShownMarkerType(entry.id) ?? 'pin',
                features: entry.places.slice(0, FEATURE_PREVIEW_SIZE).map((feature) => ({
                    name: feature.properties.poi?.name,
                    address: feature.properties.address?.freeformAddress,
                    position: feature.geometry.coordinates,
                })),
            }));

        return {
            count: entries.reduce((total, entry) => total + entry.featureCount, 0),
            entries,
        };
    } catch (error) {
        return {
            error: `Failed to get shown places: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
