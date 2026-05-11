/**
 * @module agent-toolkit-tools
 */

import type { WaypointLike } from '@tomtom-org/maps-sdk/core';
import type { Position } from 'geojson';
import { z } from 'zod';

/** @ignore */
export type ResolvedLocation = {
    /** Resolved place: a Place (with address metadata) or a bare [lng, lat] tuple. */
    place: WaypointLike;
    position: Position;
    name: string;
    /** Original query string, when the input was resolved from text. */
    query?: string;
};

/** @ignore */
export const locationInputSchema = z.union([
    z.object({
        query: z.string().describe('Location string to resolve.'),
        queryAs: z
            .enum(['poi', 'place'])
            .describe(
                '"poi" for venues / landmarks / businesses; "place" for addresses, cities, neighborhoods, parks, postal codes, and other geographies.',
            ),
    }),
    z.object({
        position: z
            .object({ lng: z.number(), lat: z.number() })
            .describe('Explicit coordinates — use when you already have a position.'),
    }),
    z.object({
        placeId: z
            .string()
            .describe(
                'ID of a place stored in session state (any previous places entry). ' +
                    'Resolves to the full Place with its POI name, address, and coordinates — ' +
                    'prefer this over re-searching by name when routing to a place the user has already seen.',
            ),
    }),
]);

/** @ignore */
export type LocationInput = z.infer<typeof locationInputSchema>;
