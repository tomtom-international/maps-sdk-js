/**
 * @module agent-toolkit-tools
 */

import { bboxFromGeoJSON, getPosition, type HasBBox } from '@tomtom-org/maps-sdk/core';
import { search, searchOne } from '@tomtom-org/maps-sdk/services';
import type { Position } from 'geojson';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { makePlacesLabel, summarizePlaces } from '../../utils';
import {
    getViewportBias,
    getViewportBoundingBox,
    resolvePoiCategories,
    shownSchema,
    showPlacesSchema,
    showResultsOnMap,
    whereSchema,
} from '../shared';
import { placesOutputSchema, toolErrorSchema } from '../shared-output-schemas';

/** Output schema for the discover-places tool. */
export const discoverPlacesOutputSchema = z.union([
    placesOutputSchema.extend({
        shown: shownSchema.optional(),
        placesEntryId: z.string().optional(),
        label: z
            .string()
            .optional()
            .describe('Human-readable label stored with the entry (e.g. "cafe", "CINEMA (50 places)").'),
    }),
    toolErrorSchema,
]);

/**
 * Tool schema for discovering places.
 */
export const discoverPlacesSchema = z
    .object({
        query: z
            .string()
            .optional()
            .describe(
                'Search query to filter places by name or address. For POI categories do not use query but use poiCategories.',
            ),
        where: whereSchema.optional().describe('Geographic scope for the search. Defaults to "within-map-bounds".'),
        radiusMeters: z.number().optional().describe('search radius in meters'),
        limit: z.number().max(100).optional().describe('default: 10 if query is supplied, 50 otherwise'),
        poiCategories: z
            .array(z.string())
            .optional()
            .describe(
                'POI category codes for filtering in CONSTANT_CASE. Call getPoiCategoryCodes first to resolve natural language (e.g. "gym", "restaurant", "aparcamiento") into codes.',
            ),
        show: showPlacesSchema.optional().describe('Options to render the results on the map.'),
        withinRange: z
            .string()
            .optional()
            .describe(
                'Range ID from findReachableArea to restrict search to that reachable area (e.g. "ranges-0"). Use recallRanges to find the ID. Mutually exclusive with where.',
            ),
    })
    // Runtime guard only — .refine() doesn't emit JSON Schema, so LLMs won't see this constraint.
    // The LLM-facing constraint is in the withinRange description ("Mutually exclusive with where").
    .refine((data) => !(data.withinRange && data.where), {
        message: 'withinRange and where are mutually exclusive — provide one or the other, not both.',
    });

export const discoverPlacesDescription =
    'Search for multiple places by text query or POI category. ' +
    'Stores results as a new places entry and returns its `placesEntryId`. ' +
    'Pass `show` to render on the map — set `show.mode: "add"` when stacking on top of an existing display ("also show cinemas"), default `"replace"` for a fresh view. ' +
    'Defaults to searching within the current map viewport; pass `where` to override. ' +
    'Query is optional — omit it to search by categories only. ' +
    'For a single specific place, use locatePlace instead.';

type WhereBias = { boundingBox?: HasBBox; position?: Position };

const searchInRange = async (
    state: ToolState,
    withinRange: string,
    query: string | undefined,
    limit: number | undefined,
    poiCategories: string[] | undefined,
): Promise<{ result: Awaited<ReturnType<typeof search>>; placesEntryId: string } | { error: string }> => {
    const rangeEntry = state.ranges.entries.find((e) => e.id === withinRange);
    if (!rangeEntry?.polygon) {
        return { error: `Range "${withinRange}" not found. Use recallRanges to list available ranges.` };
    }
    const resolvedPoiCategories = await resolvePoiCategories(poiCategories);
    const result = await search({
        query,
        limit: limit ?? (query ? 10 : 50),
        poiCategories: resolvedPoiCategories,
        geometries: [rangeEntry.polygon],
    });
    const placesEntryId = state.places.addPlaceResult(result, makePlacesLabel(result, { query, poiCategories }));
    return { result, placesEntryId };
};

const resolveWhereBias = async (
    where: z.infer<typeof whereSchema> | undefined,
    state: ToolState,
): Promise<WhereBias> => {
    const resolvedWhere = where ?? 'within-map-bounds';

    if (resolvedWhere === 'within-map-bounds') {
        return { boundingBox: getViewportBoundingBox(state.baseMap) };
    }
    if (resolvedWhere === 'nearby-map-center') {
        const position = getViewportBias(state.baseMap);
        return position ? { position } : {};
    }
    if (resolvedWhere === 'global') {
        return {};
    }
    if (typeof resolvedWhere === 'string') {
        const geoResult = await searchOne(resolvedWhere);
        if (geoResult?.bbox) return { boundingBox: geoResult.bbox };
        if (geoResult) {
            const pos = getPosition(geoResult);
            if (pos) return { position: pos };
        }
        return {};
    }
    if ('position' in resolvedWhere) {
        return { position: resolvedWhere.position as Position };
    }
    return { boundingBox: bboxFromGeoJSON(resolvedWhere.boundingBox as HasBBox) as HasBBox };
};

const resolveWhereLabel = (where: z.infer<typeof whereSchema> | undefined): string | undefined =>
    typeof where === 'string' && where !== 'within-map-bounds' && where !== 'nearby-map-center' && where !== 'global'
        ? where
        : undefined;

const searchWithBias = async (
    state: ToolState,
    query: string | undefined,
    where: z.infer<typeof whereSchema> | undefined,
    limit: number | undefined,
    poiCategories: string[] | undefined,
    radiusMeters: number | undefined,
): Promise<{ result: Awaited<ReturnType<typeof search>>; placesEntryId: string }> => {
    const biasParams = await resolveWhereBias(where, state);
    const resolvedPoiCategories = await resolvePoiCategories(poiCategories);
    const result = await search({
        query,
        limit: limit ?? (query ? 10 : 50),
        poiCategories: resolvedPoiCategories,
        ...biasParams,
        radiusMeters,
    });
    const placesEntryId = state.places.addPlaceResult(
        result,
        makePlacesLabel(result, { query, poiCategories, where: resolveWhereLabel(where) }),
    );
    return { result, placesEntryId };
};

/**
 * Create the discover places tool.
 */
/** Standalone execute for ToolEntry format. */
export const executeDiscoverPlaces = async (
    params: z.infer<typeof discoverPlacesSchema>,
    state: ToolState,
): Promise<z.infer<typeof discoverPlacesOutputSchema>> => {
    const { query, where, radiusMeters, limit, poiCategories, show, withinRange } = params;

    try {
        let result: Awaited<ReturnType<typeof search>>;
        let placesEntryId: string;

        if (withinRange) {
            const rangeResult = await searchInRange(state, withinRange, query, limit, poiCategories);
            if ('error' in rangeResult) return rangeResult;
            result = rangeResult.result;
            placesEntryId = rangeResult.placesEntryId;
        } else {
            const biasResult = await searchWithBias(state, query, where, limit, poiCategories, radiusMeters);
            result = biasResult.result;
            placesEntryId = biasResult.placesEntryId;
        }

        const shown = show ? await showResultsOnMap(state, result, placesEntryId, show) : undefined;
        const label = state.places.entries.find((entry) => entry.id === placesEntryId)?.label;

        return {
            ...summarizePlaces(result),
            placesEntryId,
            ...(label && { label }),
            ...(shown && { shown }),
        };
    } catch (error) {
        return {
            error: `Search failed: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
