/**
 * @module agent-toolkit-tools
 *
 * Place-entity geocoding primitives: resolve a query string to a named place / POI (the "what").
 * Live in `shared/` (not in the `locate-place` tool) so the resolver layer (`resolve-where`,
 * `tool-state-where-context`) can depend on them without a `shared → services → shared` cycle.
 * Area ("where") resolution is a separate concern — see `geocode-areas.ts`.
 */

import { type BBox, type Place } from '@tomtom-org/maps-sdk/core';
import { geocode, geocodeOne, search, searchOne } from '@tomtom-org/maps-sdk/services';
import type { Position } from 'geojson';

export type LocateBias = { position: Position } | { boundingBox: BBox };

export type QueryAs = 'poi' | 'place';

/**
 * Resolves a query string to up to `limit` Places. POI search when `queryAs === 'poi'`, geocoding
 * otherwise. Optional `bias` narrows the search to a region.
 */
export const locatePlaces = async (
    query: string,
    queryAs: QueryAs,
    options: { limit: number; bias?: LocateBias },
): Promise<Place[]> => {
    const [searchFn, searchOneFn] = queryAs === 'poi' ? [search, searchOne] : [geocode, geocodeOne];
    const { limit, bias } = options;

    if (bias && 'position' in bias) {
        const results = await searchFn({ query, position: bias.position, limit });
        return results.features;
    }
    if (bias && 'boundingBox' in bias) {
        const results = await searchFn({ query, boundingBox: bias.boundingBox, limit });
        return results.features;
    }
    if (limit === 1) {
        const result = await searchOneFn(query);
        return result ? [result] : [];
    }
    const results = await searchFn({ query, limit });
    return results.features;
};

/** Convenience wrapper around {@link locatePlaces} for the single-result case. */
export const locatePlace = async (query: string, queryAs: QueryAs, bias?: LocateBias): Promise<Place | null> => {
    const [first] = await locatePlaces(query, queryAs, { limit: 1, bias });
    return first ?? null;
};
