/**
 * @module agent-toolkit-tools
 */

import { type BBox, getPosition, type Place, type WaypointLike } from '@tomtom-org/maps-sdk/core';
import { geocode, geocodeOne, search, searchOne } from '@tomtom-org/maps-sdk/services';
import type { Position } from 'geojson';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { makePlacesLabel } from '../../utils/state-labels';
import { summarizePlace } from '../../utils/summarize';
import { getViewportBias, getViewportBoundingBox, shownSchema, showPlacesSchema, whereSchema } from '../shared';
import { placeOutputSchema, toolErrorSchema } from '../shared-output-schemas';

type LocateBias = { position: Position } | { boundingBox: BBox };

export const locatePlace = async (
    query: string,
    locationType: 'poi' | 'default',
    bias?: LocateBias,
): Promise<Place | null> => {
    const [searchFn, searchOneFn] = locationType === 'poi' ? [search, searchOne] : [geocode, geocodeOne];

    if (bias && 'position' in bias) {
        const results = await searchFn({ query, position: bias.position, limit: 1 });
        return results.features[0] ?? null;
    }
    if (bias && 'boundingBox' in bias) {
        const results = await searchFn({ query, boundingBox: bias.boundingBox, limit: 1 });
        return results.features[0] ?? null;
    }
    return (await searchOneFn(query)) ?? null;
};

export const locatePlaceSchema = z.object({
    query: z
        .string()
        .describe('Location string to resolve for downstream workflows such as routes or further searches.'),
    waypointIndex: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe(
            'Route location slot to stage. Ordered as [origin, ...stops, destination]. Use it if this is an origin, stop or destination for a route.',
        ),
    locationType: z
        .enum(['poi', 'default'])
        .describe(
            '"poi" for venues, landmarks, and businesses; "default" for places to geocode: addresses, parks, post codes, and geographies.',
        ),
    where: whereSchema.describe('Geographic scope for the search.'),
    show: showPlacesSchema
        .optional()
        .describe(
            'Optional map display actions to perform after resolving the place. Skip if this is an intermediate calculation for another step.',
        ),
});

export const locatePlaceOutputSchema = z.union([
    placeOutputSchema.extend({
        waypointIndex: z.number().optional(),
        shown: shownSchema.optional(),
    }),
    toolErrorSchema,
]);

export const locatePlaceDescription =
    'Resolve one user-provided location string into a normalized place summary for downstream workflows without changing the map or camera. ' +
    'Search-first: accepts landmarks, stations, venues, cities, neighborhoods, and full addresses. ' +
    'Can optionally stage a waypoint slot.';

const resolveLocateBias = async (
    where: z.infer<typeof whereSchema>,
    state: ToolState,
): Promise<LocateBias | undefined> => {
    if (where === 'nearby-map-center') {
        const position = getViewportBias(state.baseMap);
        return position ? { position } : undefined;
    }
    if (where === 'within-map-bounds') {
        return { boundingBox: getViewportBoundingBox(state.baseMap) };
    }
    if (where === 'global') {
        return undefined;
    }
    if (typeof where === 'string') {
        const geoResult = await geocodeOne(where);
        if (geoResult?.bbox) return { boundingBox: geoResult.bbox };
        if (geoResult) {
            const position = getPosition(geoResult);
            if (position) return { position };
        }
        return undefined;
    }
    if ('position' in where) {
        return { position: where.position as Position };
    }
    return { boundingBox: where.boundingBox as BBox };
};

const showLocateResult = async (
    state: ToolState,
    result: Place,
    show: z.infer<typeof showPlacesSchema>,
): Promise<z.infer<typeof shownSchema>> => {
    const shown: z.infer<typeof shownSchema> = { markerType: false, zoomMode: false };
    if (show.markerType === 'pin') {
        const placesModule = await state.places.getPlacesModule();
        await placesModule.show(result);
        shown.markerType = true;
    }
    if (show.zoomMode === 'auto') {
        if (result.bbox) {
            state.baseMap.mapLibreMap.fitBounds(result.bbox);
        } else {
            const pos = getPosition(result);
            if (pos) state.baseMap.mapLibreMap.flyTo({ center: pos as [number, number], zoom: 13 });
        }
        shown.zoomMode = true;
    }
    return shown;
};

/** Standalone execute for ToolEntry format. */
export const executeLocatePlace = async (
    params: z.infer<typeof locatePlaceSchema>,
    state: ToolState,
): Promise<z.infer<typeof locatePlaceOutputSchema>> => {
    const { query, locationType, waypointIndex, where, show } = params;

    try {
        const bias = await resolveLocateBias(where, state);
        const result = await locatePlace(query, locationType, bias);

        if (!result) {
            return { error: `No result found for "${query}"` };
        }

        state.places.addPlaceResult(result, makePlacesLabel(result, { query }));

        if (waypointIndex !== undefined) {
            state.routing.setWaypointAt(waypointIndex, result as unknown as WaypointLike);
        }

        const shown = show ? await showLocateResult(state, result, show) : undefined;

        return {
            ...summarizePlace(result),
            ...(waypointIndex !== undefined && { waypointIndex }),
            ...(shown && { shown }),
        };
    } catch (error) {
        return {
            error: `Location resolution failed: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
