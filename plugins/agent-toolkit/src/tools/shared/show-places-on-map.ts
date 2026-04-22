/**
 * @module agent-toolkit-tools
 */

import { bboxFromGeoJSON, type Place, type Places } from '@tomtom-org/maps-sdk/core';
import type { z } from 'zod';
import type { ToolState } from '../../types';
import { shownSchema, showPlacesSchema } from './schema';

/** @ignore */
export const showResultsOnMap = async (
    state: ToolState,
    result: Place | Places,
    placesEntryId: string,
    show: z.infer<typeof showPlacesSchema>,
): Promise<z.infer<typeof shownSchema>> => {
    const shown: z.infer<typeof shownSchema> = { markerType: false, zoomMode: false };
    if (show.markerType === 'pin') {
        if (show.mode === 'add') {
            await state.places.addShownEntries([placesEntryId]);
        } else {
            await state.places.setShownEntries([placesEntryId]);
        }
        shown.markerType = true;
    }
    if (show.zoomMode === 'auto') {
        const bbox = bboxFromGeoJSON(result);
        if (bbox) state.baseMap.mapLibreMap.fitBounds(bbox, { padding: 50 });
        shown.zoomMode = true;
    }
    return shown;
};
