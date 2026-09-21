/**
 * @module agent-toolkit-tools
 */

import { getPosition } from '@tomtom-org/maps-sdk/core';
import type { ToolExecuteOptions, ToolState } from '../../types';
import { type LocationInput, locatePlace, type ResolvedLocation } from '../shared';

/** @ignore */
export const resolveLocationInput = async (
    input: LocationInput,
    state: ToolState,
    options?: ToolExecuteOptions,
): Promise<ResolvedLocation | null> => {
    if ('position' in input) {
        const [lng, lat] = input.position;
        return {
            place: [lng, lat],
            position: [lng, lat],
            name: `[${lng}, ${lat}]`,
        };
    }

    if ('placeIdOrEntryId' in input) {
        const { placeIdOrEntryId } = input;
        // Accept EITHER a place feature id (Place.id, e.g. "odj-…") OR a places entry id
        // (placesEntryId / the `entryId` hint, e.g. "berlin-brandenburg-airport"). The model
        // routinely reuses the friendly entry id it just set on locatePlace, so fall back to
        // resolving the entry to its place when the feature-id lookup misses. A multi-place entry
        // (e.g. a discoverPlaces result) resolves to its first place — a single waypoint needs one point.
        let hit = state.places.findPlaceById(placeIdOrEntryId);
        if (!hit) {
            const entry = state.places.entries.find((e) => e.id === placeIdOrEntryId);
            const place = entry?.data[0];
            if (place) hit = { place, entryId: entry.id };
        }
        if (!hit) return null;
        const position = getPosition(hit.place);
        if (!position) return null;
        return {
            place: hit.place,
            position,
            name: hit.place.properties?.poi?.name ?? hit.place.properties?.address?.freeformAddress ?? placeIdOrEntryId,
        };
    }

    const resolved = await locatePlace(input.query, input.queryAs, undefined, options);
    if (!resolved) return null;

    const pos = getPosition(resolved);
    if (!pos) return null;

    return {
        place: resolved,
        position: pos,
        name: resolved.properties?.address?.freeformAddress ?? input.query,
        query: input.query,
    };
};
