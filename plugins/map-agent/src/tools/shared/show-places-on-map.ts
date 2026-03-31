/**
 * @module map-agent-tools
 */

import { bboxFromGeoJSON, type Place, type Places } from '@tomtom-org/maps-sdk/core';
import type { z } from 'zod';
import type { ToolState } from '../../types';
import { shownSchema, showPlacesSchema } from './schema';

export async function showResultsOnMap(
    state: ToolState,
    result: Place | Places,
    show: z.infer<typeof showPlacesSchema>,
): Promise<z.infer<typeof shownSchema>> {
    const shown: z.infer<typeof shownSchema> = { markerType: false, zoomMode: false };
    if (show.markerType === 'pin') {
        const placesModule = await state.places.getPlacesModule();
        await placesModule.show(result);
        shown.markerType = true;
    }
    if (show.zoomMode === 'auto') {
        const bbox = bboxFromGeoJSON(result);
        if (bbox) state.baseMap.mapLibreMap.fitBounds(bbox, { padding: 50 });
        shown.zoomMode = true;
    }
    return shown;
}
