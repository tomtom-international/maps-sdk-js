/**
 * @module map-agent-tools
 */

import { alongRouteSearch } from '@tomtom-org/maps-sdk/services';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { makePlacesLabel } from '../../utils/state-labels';
import { summarizePlaces } from '../../utils/summarize';
import { resolvePoiCategories } from '../shared/resolve-poi-categories';
import { shownSchema, showPlacesSchema } from '../shared/schema';
import { showResultsOnMap } from '../shared/show-places-on-map';
import { placesOutputSchema, toolErrorSchema } from '../shared-output-schemas';

const noRouteSchema = z.object({ status: z.literal('no_route') });

export const searchAlongRouteOutputSchema = z.union([
    placesOutputSchema.extend({
        placeResultIndex: z.string(),
        shown: shownSchema.optional(),
    }),
    noRouteSchema,
    toolErrorSchema,
]);

export const searchAlongRouteSchema = z.object({
    query: z.string().optional().describe('Search query to filter POIs by name.'),
    poiCategories: z
        .array(z.string())
        .optional()
        .describe('POI category codes in CONSTANT_CASE. Call getPoiCategoryCodes to resolve natural-language names.'),
    routeId: z
        .string()
        .optional()
        .describe(
            'Stable route entry ID (e.g. "routes-1"). Use recallRoutes to find the right ID; defaults to the most recent route.',
        ),
    maxDetourTimeSeconds: z.number().describe('Maximum detour time in seconds to reach a POI from the route.'),
    sortBy: z.enum(['detourTime', 'detourOffset']).optional().describe('Default: detourTime.'),
    limit: z.number().max(100).optional().describe('Max results. Default: 10.'),
    show: showPlacesSchema.optional().describe('Display options to render results on the map after search.'),
});

export const searchAlongRouteDescription =
    'Search for POIs along a calculated route, ranked by detour cost. ' +
    'Reads the route from state — call setRouteLocations first. ' +
    'Use recallRoutes to find the ID of a specific route; defaults to the most recent. ' +
    'Stores results in places history; use placeResultIndex with showPlaces to display them. ' +
    'status: no_route if no route exists in state.';

function resolveRouteEntry(state: ToolState, routeId: string | undefined) {
    const entries = state.routing.entries;
    if (entries.length === 0) return null;

    const entry = routeId ? entries.find((e) => e.id === routeId) : entries.at(-1);
    if (!entry) return `No route found with id "${routeId}". Use recallRoutes to list available routes.`;

    const routeFeature = entry.data.features[0];
    if (!routeFeature) return 'Route entry has no geometry.';

    return { entry, routeFeature };
}

async function executeAlongRouteSearch(
    params: {
        query?: string;
        poiCategories?: string[];
        maxDetourTimeSeconds: number;
        sortBy?: 'detourTime' | 'detourOffset';
        limit?: number;
    },
    routeFeature: Parameters<typeof alongRouteSearch>[0]['route'],
) {
    const { query, poiCategories, maxDetourTimeSeconds, sortBy, limit } = params;
    const resolvedPoiCategories = await resolvePoiCategories(poiCategories);
    return alongRouteSearch({
        route: routeFeature,
        maxDetourTimeSeconds,
        ...(query && { query }),
        ...(resolvedPoiCategories && { poiCategories: resolvedPoiCategories }),
        ...(sortBy && { sortBy }),
        ...(limit !== undefined && { limit }),
    });
}

/** Standalone execute for ToolEntry format. */
export async function executeSearchAlongRoute(
    params: z.infer<typeof searchAlongRouteSchema>,
    state: ToolState,
): Promise<z.infer<typeof searchAlongRouteOutputSchema>> {
    const { query, poiCategories, routeId, maxDetourTimeSeconds, sortBy, limit, show } = params;

    const resolved = resolveRouteEntry(state, routeId);
    if (resolved === null) return { status: 'no_route' };
    if (typeof resolved === 'string') return { error: resolved };
    const { entry, routeFeature } = resolved;

    try {
        const result = await executeAlongRouteSearch(
            { query, poiCategories, maxDetourTimeSeconds, sortBy, limit },
            routeFeature,
        );

        const label = makePlacesLabel(result, { query, poiCategories, routeLabel: entry.label });
        const placeResultIndex = state.places.addPlaceResult(result, label);

        const shown = show ? await showResultsOnMap(state, result, show) : undefined;

        return {
            ...summarizePlaces(result),
            placeResultIndex,
            ...(shown && { shown }),
        };
    } catch (error) {
        return {
            error: `Along-route search failed: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}
