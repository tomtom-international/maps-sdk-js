/**
 * @module agent-toolkit-tools
 *
 * Place-entity geocoding primitives: resolve a query string to a named place / POI (the "what").
 * Live in `shared/` (not in the `locate-place` tool) so the resolver layer (`resolve-where`,
 * `tool-state-where-context`) can depend on them without a `shared → services → shared` cycle.
 * Area ("where") resolution is a separate concern — see `geocode-areas.ts`.
 */

import { type BBox, type Place } from '@tomtom-org/maps-sdk/core';
import { geocode, search } from '@tomtom-org/maps-sdk/services';
import type { Position } from 'geojson';
import type { ToolExecuteOptions } from '../../types';
import { withAgentToolkitHeaders } from './agent-headers';

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
    execOptions?: ToolExecuteOptions,
): Promise<Place[]> => {
    const searchFn = queryAs === 'poi' ? search : geocode;
    const { limit, bias } = options;

    if (bias && 'position' in bias) {
        const requestParams = withAgentToolkitHeaders({
            query,
            position: bias.position,
            limit,
            signal: execOptions?.signal,
        });
        const results = await searchFn(requestParams);
        return results.features;
    }
    if (bias && 'boundingBox' in bias) {
        const requestParams = withAgentToolkitHeaders({
            query,
            boundingBox: bias.boundingBox,
            limit,
            signal: execOptions?.signal,
        });
        const results = await searchFn(requestParams);
        return results.features;
    }
    const requestParams = withAgentToolkitHeaders({ query, limit, signal: execOptions?.signal });
    const results = await searchFn(requestParams);
    return results.features;
};

/** Convenience wrapper around {@link locatePlaces} for the single-result case. */
export const locatePlace = async (
    query: string,
    queryAs: QueryAs,
    bias?: LocateBias,
    execOptions?: ToolExecuteOptions,
): Promise<Place | null> => {
    const [first] = await locatePlaces(query, queryAs, { limit: 1, bias }, execOptions);
    return first ?? null;
};
