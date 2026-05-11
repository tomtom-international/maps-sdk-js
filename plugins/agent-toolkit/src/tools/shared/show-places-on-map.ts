/**
 * @module agent-toolkit-tools
 */

import { bboxFromGeoJSON } from '@tomtom-org/maps-sdk/core';
import type { z } from 'zod';
import type { ToolState } from '../../types';
import { shownSchema, showPlacesSchema } from './schema';

/** @ignore */
export const showResultsOnMap = async (
    state: ToolState,
    placesEntryIds: readonly string[],
    show: z.infer<typeof showPlacesSchema>,
): Promise<z.infer<typeof shownSchema>> => {
    const shown: z.infer<typeof shownSchema> = { markerType: false, zoomMode: false };
    if (show.markerType !== 'none') {
        const isMultiple = state.places.entryMode === 'multiple';
        if (isMultiple && show.hidePreviousEntries !== 'all') {
            if (Array.isArray(show.hidePreviousEntries)) {
                const exclude = new Set(placesEntryIds);
                const toHide = show.hidePreviousEntries.filter((id) => !exclude.has(id));
                if (toHide.length > 0) await state.places.removeShownEntries(toHide);
            }
            await state.places.addShownEntries(placesEntryIds, show.markerType);
        } else {
            await state.places.setShownEntries(placesEntryIds, show.markerType);
        }
        shown.markerType = true;
    }
    if (show.zoomMode === 'auto') {
        const features = state.places.getShownFeatures();
        if (features.length > 0) {
            const bbox = bboxFromGeoJSON({ type: 'FeatureCollection', features });
            if (bbox) state.baseMap.mapLibreMap.fitBounds(bbox, { padding: 50 });
        }
        shown.zoomMode = true;
    }
    return shown;
};
