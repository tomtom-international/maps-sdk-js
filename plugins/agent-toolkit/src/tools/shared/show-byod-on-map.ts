/**
 * @module agent-toolkit-tools
 */

import { bboxFromGeoJSON } from '@tomtom-org/maps-sdk/core';
import type { Feature } from 'geojson';
import type { z } from 'zod';
import type { ToolState } from '../../types';
import { hidePreviousShownEntries } from './hide-previous-entries';
import type { showByodSchema, shownByodSchema } from './schema';

// Gather the features of every BYOD entry currently rendered on the map — the
// target the camera fits when `zoomMode: "auto"`.
const collectShownByodFeatures = (state: ToolState): Feature[] => {
    const features: Feature[] = [];
    for (const entryId of state.byod.shownEntryIds) {
        const entry = state.byod.findById(entryId);
        if (entry) features.push(...entry.data.features);
    }
    return features;
};

/**
 * Render a BYOD entry on the map per the tool's `show` options: hide
 * previously-shown entries (per `hidePreviousEntries`), show the new entry, then
 * optionally fit the camera to every shown BYOD entry. Sequential by design —
 * map mutations must not race (see ENGINEERING-GUIDELINES §6).
 *
 * @ignore
 */
export const showByodOnMap = async (
    state: ToolState,
    byodEntryId: string,
    show: z.infer<typeof showByodSchema>,
): Promise<z.infer<typeof shownByodSchema>> => {
    await hidePreviousShownEntries(state.byod, [byodEntryId], show.hidePreviousEntries);
    await state.byod.showEntry(byodEntryId);

    let zoomMode = false;
    if (show.zoomMode === 'auto') {
        const features = collectShownByodFeatures(state);
        if (features.length > 0) {
            const bbox = bboxFromGeoJSON({ type: 'FeatureCollection', features });
            if (bbox) {
                state.baseMap.mapLibreMap.fitBounds(bbox, { padding: 50 });
                zoomMode = true;
            }
        }
    }
    return { zoomMode };
};
