/**
 * @module agent-toolkit-tools
 */

import { type BBox, getPosition, type Place, type WaypointLike } from '@tomtom-org/maps-sdk/core';
import { geocode, geocodeOne, search, searchOne } from '@tomtom-org/maps-sdk/services';
import * as turf from '@turf/turf';
import type { Position } from 'geojson';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { makePlacesLabel, summarizePlace } from '../../utils';
import {
    getViewportBias,
    getViewportBoundingBox,
    placesEntryIdHintSchema,
    showEntryGeometries,
    shownSchema,
    showPlaceGeometriesSchema,
    showPlacesSchema,
    showResultsOnMap,
    whereSchema,
} from '../shared';
import { placeOutputSchema, toolErrorSchema } from '../shared-output-schemas';

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
): Promise<Place[]> => {
    const [searchFn, searchOneFn] = queryAs === 'poi' ? [search, searchOne] : [geocode, geocodeOne];
    const { limit, bias } = options;

    if (bias && 'position' in bias) {
        const results = await searchFn({ query, position: bias.position, limit });
        return results.features;
    }
    if (bias && 'boundingBox' in bias) {
        const results = await searchFn({ query, boundingBox: bias.boundingBox, limit });
        return results.features;
    }
    if (limit === 1) {
        const result = await searchOneFn(query);
        return result ? [result] : [];
    }
    const results = await searchFn({ query, limit });
    return results.features;
};

/** Convenience wrapper around {@link locatePlaces} for the single-result case. */
export const locatePlace = async (query: string, queryAs: QueryAs, bias?: LocateBias): Promise<Place | null> => {
    const [first] = await locatePlaces(query, queryAs, { limit: 1, bias });
    return first ?? null;
};

export const locatePlaceSchema = z.object({
    query: z.string().describe('Location string to resolve for downstream routes or searches.'),
    waypointIndex: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe('Route slot to stage [origin, ...stops, destination]. Set if this is an origin/stop/destination.'),
    queryAs: z
        .enum(['poi', 'place'])
        .describe(
            '"poi" for venues / landmarks / businesses; ' +
                '"place" for addresses, cities, neighborhoods, parks, postal codes, geographies.',
        ),
    where: whereSchema.describe('Geographic scope.'),
    show: showPlacesSchema
        .optional()
        .describe('Map display actions after resolving. Skip for intermediate calculations.'),
    entryId: placesEntryIdHintSchema,
    geometry: showPlaceGeometriesSchema,
});

export const locatePlaceOutputSchema = z.union([
    placeOutputSchema.extend({
        waypointIndex: z.number().optional(),
        shown: shownSchema.optional(),
        geometryFetched: z
            .boolean()
            .optional()
            .describe('Whether a boundary polygon was fetched and cached on the entry (when `geometry` was set).'),
        geometryShown: z.boolean().optional().describe('Whether the fetched polygon was rendered on the map.'),
    }),
    toolErrorSchema,
]);

export const locatePlaceDescription =
    'Resolve ONE named location (landmark, venue, city, neighborhood, address, POI) to a normalized place summary. ' +
    'Use this for any SINGLE named place — including requests for its boundary / polygon / outline / footprint (via `geometry`), ' +
    'pin or zoom display (via `show`), or staging as a routing waypoint. ' +
    'For multi-place or category searches, use discoverPlaces.';

type ResolveBiasResult = { bias?: LocateBias } | { error: string };

const resolveWithinBias = async (
    where: Extract<z.infer<typeof whereSchema>, { mode: 'within' }>,
    state: ToolState,
): Promise<ResolveBiasResult> => {
    if (where.viewport) return { bias: { boundingBox: getViewportBoundingBox(state.baseMap) } };
    if (where.boundingBox) return { bias: { boundingBox: where.boundingBox as BBox } };
    if (where.query) {
        const viewport = getViewportBias(state.baseMap);
        const place = await locatePlace(
            where.query,
            where.queryAs ?? 'place',
            viewport ? { position: viewport } : undefined,
        );
        if (!place) return { bias: undefined };
        if (place.bbox) return { bias: { boundingBox: place.bbox } };
        const position = getPosition(place);
        return { bias: position ? { position } : undefined };
    }
    if (where.placeId) {
        const lookup = state.places.findPlaceById(where.placeId);
        if (!lookup) {
            return { error: `Unknown placeId "${where.placeId}". Use recallPlaces to list available IDs.` };
        }
        if (!lookup.place.properties.dataSources?.geometry?.id) {
            return {
                error: `Place "${where.placeId}" has no geometry data source (most addresses and streets lack one).`,
            };
        }
        const feature = await state.places.fetchPlaceGeometry(where.placeId);
        if (!feature) {
            return { error: `Geometry Data service returned no feature for place "${where.placeId}".` };
        }
        const bbox = (feature.bbox as BBox | undefined) ?? (turf.bbox(feature) as BBox);
        return { bias: { boundingBox: bbox } };
    }
    return { bias: undefined };
};

const resolveNearbyBias = async (
    where: Extract<z.infer<typeof whereSchema>, { mode: 'nearby' }>,
    state: ToolState,
): Promise<ResolveBiasResult> => {
    if (where.viewport) {
        const position = getViewportBias(state.baseMap);
        return { bias: position ? { position } : undefined };
    }
    if (where.position) return { bias: { position: where.position as Position } };
    if (where.query) {
        const viewport = getViewportBias(state.baseMap);
        const place = await locatePlace(
            where.query,
            where.queryAs ?? 'place',
            viewport ? { position: viewport } : undefined,
        );
        if (!place) return { bias: undefined };
        const position = getPosition(place);
        return { bias: position ? { position } : undefined };
    }
    return { bias: undefined };
};

const resolveLocateBias = async (where: z.infer<typeof whereSchema>, state: ToolState): Promise<ResolveBiasResult> => {
    if (where.mode === 'global') return { bias: undefined };
    if (where.mode === 'within') return resolveWithinBias(where, state);
    return resolveNearbyBias(where, state);
};

// Defer hide + marker rendering to the shared helper; only the zoom step is
// locate-specific (the place's own bbox / centroid carries more meaning for a
// single named place than fitting to its point representation).
const showLocateResult = async (
    state: ToolState,
    result: Place,
    placesEntryId: string,
    show: z.infer<typeof showPlacesSchema>,
): Promise<z.infer<typeof shownSchema>> => {
    const shown = await showResultsOnMap(state, [placesEntryId], { ...show, zoomMode: 'none' });
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
    const { query, queryAs, waypointIndex, where, show, entryId, geometry } = params;

    try {
        const resolved = await resolveLocateBias(where, state);
        if ('error' in resolved) return resolved;
        const result = await locatePlace(query, queryAs, resolved.bias);

        if (!result) {
            return { error: `No result found for "${query}"` };
        }

        const placesEntryId = state.places.addPlaceResult(result, makePlacesLabel(result, { query }), entryId);

        if (waypointIndex !== undefined) {
            state.routing.setWaypointAt(waypointIndex, result as unknown as WaypointLike);
        }

        const shown = show ? await showLocateResult(state, result, placesEntryId, show) : undefined;

        let geometryFetched: boolean | undefined;
        let geometryShown: boolean | undefined;
        if (geometry) {
            const geometryResult = await showEntryGeometries(state, placesEntryId, geometry);
            geometryFetched = geometryResult.fetched > 0;
            if (geometryResult.shown) geometryShown = true;
        }

        return {
            ...summarizePlace(result),
            ...(waypointIndex !== undefined && { waypointIndex }),
            ...(shown && { shown }),
            ...(geometryFetched !== undefined && { geometryFetched }),
            ...(geometryShown !== undefined && { geometryShown }),
        };
    } catch (error) {
        return {
            error: `Location resolution failed: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
