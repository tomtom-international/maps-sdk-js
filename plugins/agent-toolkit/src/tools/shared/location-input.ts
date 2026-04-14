/**
 * @module agent-toolkit-tools
 */

import { getPosition, type WaypointLike } from '@tomtom-org/maps-sdk/core';
import type { Position } from 'geojson';
import { z } from 'zod';
import { locatePlace } from '../services';

export const locationInputSchema = z.union([
    z.object({
        query: z.string().describe('Location string to resolve.'),
        locationType: z.enum(['poi', 'default']).describe('"poi" for landmarks and venues; "default" for addresses.'),
    }),
    z.object({
        position: z
            .object({ lng: z.number(), lat: z.number() })
            .describe('Explicit coordinates — use when you already have a position.'),
    }),
]);

export type LocationInput = z.infer<typeof locationInputSchema>;

export type ResolvedLocation = {
    /** Resolved place: a Place (with address metadata) or a bare [lng, lat] tuple. */
    place: WaypointLike;
    position: Position;
    name: string;
    /** Original query string, when the input was resolved from text. */
    query?: string;
};

/**
 * Resolve a LocationInput to coordinates, a display name, and a WaypointLike.
 * Returns null when a query-based location cannot be found.
 */
export async function resolveLocationInput(input: LocationInput): Promise<ResolvedLocation | null> {
    if ('position' in input) {
        const { lng, lat } = input.position;
        return {
            place: [lng, lat],
            position: [lng, lat],
            name: `[${lng}, ${lat}]`,
        };
    }

    const resolved = await locatePlace(input.query, input.locationType);
    if (!resolved) return null;

    const pos = getPosition(resolved);
    if (!pos) return null;

    return {
        place: resolved,
        position: pos,
        name: resolved.properties?.address?.freeformAddress ?? input.query,
        query: input.query,
    };
}
