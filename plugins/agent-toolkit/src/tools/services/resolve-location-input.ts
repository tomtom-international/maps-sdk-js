/**
 * @module agent-toolkit-tools
 */

import { getPosition } from '@tomtom-org/maps-sdk/core';
import type { ToolState } from '../../types';
import { type LocationInput, locatePlace, type ResolvedLocation } from '../shared';

/** @ignore */
export const resolveLocationInput = async (
    input: LocationInput,
    state: ToolState,
): Promise<ResolvedLocation | null> => {
    if ('position' in input) {
        const { lng, lat } = input.position;
        return {
            place: [lng, lat],
            position: [lng, lat],
            name: `[${lng}, ${lat}]`,
        };
    }

    if ('placeId' in input) {
        const hit = state.places.findPlaceById(input.placeId);
        if (!hit) return null;
        const position = getPosition(hit.place);
        if (!position) return null;
        return {
            place: hit.place,
            position,
            name: hit.place.properties?.poi?.name ?? hit.place.properties?.address?.freeformAddress ?? input.placeId,
        };
    }

    const resolved = await locatePlace(input.query, input.queryAs);
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
