/**
 * @module agent-toolkit-tools
 */

import { getPosition, type Place } from '@tomtom-org/maps-sdk/core';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { makePlacesLabel, summarizePlace } from '../../utils';
import {
    isResolveError,
    type LocateBias,
    locatePlace,
    placesEntryIdHintSchema,
    resolveNearbyPosition,
    resolveWithinAreas,
    showEntryGeometries,
    shownSchema,
    showPlaceGeometriesSchema,
    showPlacesSchema,
    showResultsOnMap,
    unionBBox,
    whereSchema,
} from '../shared';
import { toolStateToWhereContext } from '../shared/tool-state-where-context';
import { placeOutputSchema, toolErrorSchema } from '../shared-output-schemas';

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
    where: whereSchema
        .optional()
        .describe(
            'Optional geographic scope. OMIT to resolve a uniquely-named place anywhere (mode "global", ' +
                'the default) — correct for landmarks, cities, and areas like "Schiphol" or "Westminster", ' +
                'on-screen or not. Use "nearby" (a SOFT bias toward a point / viewport centre / query) only to ' +
                'disambiguate same-named places. Use "within" only to HARD-restrict the result to a known area ' +
                '(boundingBox / query / placeId).',
        ),
    show: showPlacesSchema
        .optional()
        .describe('Map display actions after resolving. Skip for intermediate calculations.'),
    entryId: placesEntryIdHintSchema,
    geometry: showPlaceGeometriesSchema,
});

export const locatePlaceOutputSchema = z.union([
    placeOutputSchema.extend({
        placesEntryId: z
            .string()
            .describe(
                'Places entry id the result was written to — pass as `placesEntryIDs` to analyseData / processData.',
            ),
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
    // Delegate to the shared resolver. `bboxOnlyQueries` because LocateBias has no polygon form —
    // the within area only narrows the final geocode to a bounding box. The within schema enforces
    // EXACTLY ONE field, so at most one area returns; unionBBox is a no-op here but keeps the shape
    // correct if the schema ever relaxes. A `within.query` resolves as an AREA (never a POI), matching
    // discoverPlaces' `where.queries` — so `within.queryAs` is not consulted. An unresolvable area
    // surfaces the resolver's actionable error rather than silently widening to a global search.
    const within = await resolveWithinAreas(
        {
            viewport: where.viewport,
            boundingBox: where.boundingBox,
            queries: where.query ? [{ query: where.query, queryAs: where.queryAs }] : undefined,
            placeIds: where.placeId ? [where.placeId] : undefined,
        },
        toolStateToWhereContext(state),
        { bboxOnlyQueries: true },
    );
    if (isResolveError(within)) return within;

    if (within.areas.length === 0) return { bias: undefined };

    return { bias: { boundingBox: unionBBox(within.areas.map((a) => a.bbox)) } };
};

const resolveNearbyBias = async (
    where: Extract<z.infer<typeof whereSchema>, { mode: 'nearby' }>,
    state: ToolState,
): Promise<ResolveBiasResult> => {
    const { position } = await resolveNearbyPosition(
        {
            viewport: where.viewport,
            position: where.position,
            query: where.query,
            queryAs: where.queryAs,
        },
        toolStateToWhereContext(state),
    );
    return { bias: position ? { position } : undefined };
};

const resolveLocateBias = async (
    where: z.infer<typeof whereSchema> | undefined,
    state: ToolState,
): Promise<ResolveBiasResult> => {
    // No `where` (or explicit global) → resolve the name anywhere, no bias. This is the default for a
    // uniquely-named place; the model no longer has to fill a mandatory scope and reach for the viewport.
    if (!where || where.mode === 'global') return { bias: undefined };
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

        const placesEntryId = await state.places.addPlaceResult(result, makePlacesLabel(result, { query }), entryId);

        if (waypointIndex !== undefined) {
            state.routing.setWaypointAt(waypointIndex, result);
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
            placesEntryId,
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
