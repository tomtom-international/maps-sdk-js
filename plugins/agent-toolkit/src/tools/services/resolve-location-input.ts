/**
 * @module agent-toolkit-tools
 */

import { getPosition } from '@tomtom-org/maps-sdk/core';
import type { LocationInput, ResolvedLocation } from '../shared';
import { locatePlace } from './locate-place';

/** @ignore */
export const resolveLocationInput = async (input: LocationInput): Promise<ResolvedLocation | null> => {
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
};
