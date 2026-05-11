/**
 * @module agent-toolkit-tools
 */

import type { z } from 'zod';
import type { ToolState } from '../../types';
import type { showPlaceGeometriesSchema } from './schema';

/** @ignore */
export type ShowEntryGeometriesResult = { fetched: number; shown: boolean };

/**
 * Fetch boundary polygons for every place in an entry that has a geometry data source,
 * cache them on the entry, and optionally render them via the entry's GeometriesModule.
 *
 * Shared by tools that produce a single places entry (discoverPlaces, locatePlace) — they
 * differ only in how they shape the result into their output schemas.
 *
 * @ignore
 */
export const showEntryGeometries = async (
    state: ToolState,
    placesEntryId: string,
    config: NonNullable<z.infer<typeof showPlaceGeometriesSchema>>,
): Promise<ShowEntryGeometriesResult> => {
    const fetched = await state.places.fetchGeometriesForEntry(placesEntryId);
    if (config.show && fetched.length > 0) {
        await state.places.showPlaceGeometries(fetched, config.theme ?? 'outline', config.mode ?? 'replace');
        return { fetched: fetched.length, shown: true };
    }
    return { fetched: fetched.length, shown: false };
};
