/**
 * @module map-agent-tools
 */

import { bboxFromGeoJSON, getPosition, type HasBBox } from '@tomtom-org/maps-sdk/core';
import { search, searchOne } from '@tomtom-org/maps-sdk/services';
import type { Position } from 'geojson';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { makePlacesLabel } from '../../utils/state-labels';
import { summarizePlaces } from '../../utils/summarize';
import { resolvePoiCategories } from '../shared/resolve-poi-categories';
import { shownSchema, showPlacesSchema, whereSchema } from '../shared/schema';
import { showResultsOnMap } from '../shared/show-places-on-map';
import { getViewportBias, getViewportBoundingBox } from '../shared/viewport-bias';
import { placesOutputSchema, toolErrorSchema } from '../shared-output-schemas';

/** Output schema for the discover-places tool. */
export const discoverPlacesOutputSchema = z.union([
    placesOutputSchema.extend({ shown: shownSchema.optional(), placeResultIndex: z.string().optional() }),
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
        show: showPlacesSchema.optional().describe('Options to display the results on the map.'),
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
    'Search for discovery and multi-result workflows such as nearby, category, list, and comparison queries. ' +
    'Returns multiple places without changing the map until showPlaces is called. ' +
    'Defaults to searching within the current map viewport bounds. ' +
    'Pass where explicitly to override the geographic scope. Query is optional — omit it to search by categories only. ' +
    'If searching for a specific place, use locatePlace instead.';

type WhereBias = { boundingBox?: HasBBox; position?: Position };

async function searchInRange(
    state: ToolState,
    withinRange: string,
    query: string | undefined,
    limit: number | undefined,
    poiCategories: string[] | undefined,
): Promise<{ result: Awaited<ReturnType<typeof search>>; placeResultIndex: string } | { error: string }> {
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
    const placeResultIndex = state.places.addPlaceResult(result, makePlacesLabel(result, { query, poiCategories }));
    return { result, placeResultIndex };
}

async function resolveWhereBias(where: z.infer<typeof whereSchema> | undefined, state: ToolState): Promise<WhereBias> {
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
}

function resolveWhereLabel(where: z.infer<typeof whereSchema> | undefined): string | undefined {
    return typeof where === 'string' &&
        where !== 'within-map-bounds' &&
        where !== 'nearby-map-center' &&
        where !== 'global'
        ? where
        : undefined;
}

async function searchWithBias(
    state: ToolState,
    query: string | undefined,
    where: z.infer<typeof whereSchema> | undefined,
    limit: number | undefined,
    poiCategories: string[] | undefined,
    radiusMeters: number | undefined,
): Promise<{ result: Awaited<ReturnType<typeof search>>; placeResultIndex: string }> {
    const biasParams = await resolveWhereBias(where, state);
    const resolvedPoiCategories = await resolvePoiCategories(poiCategories);
    const result = await search({
        query,
        limit: limit ?? (query ? 10 : 50),
        poiCategories: resolvedPoiCategories,
        ...biasParams,
        radiusMeters,
    });
    const placeResultIndex = state.places.addPlaceResult(
        result,
        makePlacesLabel(result, { query, poiCategories, where: resolveWhereLabel(where) }),
    );
    return { result, placeResultIndex };
}

/**
 * Create the discover places tool.
 */
/** Standalone execute for ToolEntry format. */
export async function executeDiscoverPlaces(
    params: z.infer<typeof discoverPlacesSchema>,
    state: ToolState,
): Promise<z.infer<typeof discoverPlacesOutputSchema>> {
    const { query, where, radiusMeters, limit, poiCategories, show, withinRange } = params;

    try {
        let result: Awaited<ReturnType<typeof search>>;
        let placeResultIndex: string | undefined;

        if (withinRange) {
            const rangeResult = await searchInRange(state, withinRange, query, limit, poiCategories);
            if ('error' in rangeResult) return rangeResult;
            result = rangeResult.result;
            placeResultIndex = rangeResult.placeResultIndex;
        } else {
            const biasResult = await searchWithBias(state, query, where, limit, poiCategories, radiusMeters);
            result = biasResult.result;
            placeResultIndex = biasResult.placeResultIndex;
        }

        const shown = show ? await showResultsOnMap(state, result, show) : undefined;

        return {
            ...summarizePlaces(result),
            placeResultIndex,
            ...(shown && { shown }),
        };
    } catch (error) {
        return {
            error: `Search failed: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}
