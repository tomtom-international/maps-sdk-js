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
        locationType: z.enum(['poi', 'default']).describe('"poi" for landmarks and venues; "default" for addresses.'),
    }),
    z.object({
        position: z
            .object({ lng: z.number(), lat: z.number() })
            .describe('Explicit coordinates — use when you already have a position.'),
    }),
]);

/** @ignore */
export type LocationInput = z.infer<typeof locationInputSchema>;
