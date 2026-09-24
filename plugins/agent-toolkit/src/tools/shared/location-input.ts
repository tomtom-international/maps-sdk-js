/**
 * @module agent-toolkit-tools
 */

import type { WaypointLike } from '@tomtom-org/maps-sdk/core';
import type { Position } from 'geojson';
import { z } from 'zod';
import { positionSchema } from './schema';

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
        position: positionSchema.describe(
            'Explicit [lng, lat] — GeoJSON order, longitude first. Use when you already have a ' +
                'position, e.g. copied straight from a getViewport / getCurrentLocation / ' +
                'reverseGeocode result. lng in [-180, 180], lat in [-90, 90].',
        ),
    }),
    z.object({
        placeIdOrEntryId: z
            .string()
            .describe(
                'Place already in session state, by its feature `id` or its `placesEntryId`. ' +
                    'Prefer over re-searching by name. Prefer a feature `id`: it targets one place, ' +
                    'whereas an entry id resolves to its FIRST place (fine for a single-place locatePlace ' +
                    'entry, ambiguous for a multi-place discoverPlaces one).',
            ),
    }),
]);

/** @ignore */
export type LocationInput = z.infer<typeof locationInputSchema>;

/**
 * Names a location input in an error message, without resolving it — so the model reads back the
 * same thing it sent.
 *
 * @ignore
 */
export const labelForLocationInput = (location: LocationInput): string => {
    if ('query' in location) return `"${location.query}"`;

    if ('placeIdOrEntryId' in location) return `placeIdOrEntryId "${location.placeIdOrEntryId}"`;

    return JSON.stringify(location.position);
};
