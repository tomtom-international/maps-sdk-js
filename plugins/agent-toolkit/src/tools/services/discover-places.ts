/**
 * @module agent-toolkit-tools
 */

import { bboxFromBBoxes, type HasBBox, type POICategory } from '@tomtom-org/maps-sdk/core';
import { alongRouteSearch, type GeoBias, search } from '@tomtom-org/maps-sdk/services';
import type { MultiPolygon, Polygon, Position } from 'geojson';
import { z } from 'zod';
import type { FeatureFlags, ToolEntry, ToolEntryBuilder, ToolExecuteOptions, ToolState } from '../../types';
import { makePlacesLabel, summarizePlaces } from '../../utils';
import {
    getRangePolygons,
    getViewportBoundingBox,
    globalWhereSchema,
    isResolveError,
    nearbyWhereSchema,
    placesEntryIdHintSchema,
    type ResolvedAreaDisclosure,
    resolveNearby,
    resolvePoiCategories,
    resolveWithin,
    sharedWithinFields,
    showEntryGeometries,
    shownSchema,
    showPlaceGeometriesSchema,
    showPlacesSchema,
    showResultsOnMap,
    withAgentToolkitHeaders,
} from '../shared';
import { toolStateToWhereContext } from '../shared/tool-state-where-context';
import { buildPlacesOutputSchema, resolvedAreasOutputSchema, toolErrorSchema } from '../shared-output-schemas';

/** Build the flag-aware output schema for the discover-places tool. */
export const buildDiscoverPlacesOutputSchema = (flags: FeatureFlags) =>
    z.union([
        buildPlacesOutputSchema(flags).extend({
            shown: shownSchema.optional(),
            placesEntryId: z.string().optional(),
            label: z
                .string()
                .optional()
                .describe('Human-readable label stored with the entry (e.g. "cafe", "CINEMA (50 places)").'),
            geometriesFetched: z
                .number()
                .optional()
                .describe('Count of boundary polygons fetched and cached on the entry (when `geometries` was set).'),
            geometriesShown: z.boolean().optional().describe('Whether the fetched polygons were rendered on the map.'),
            resolvedAreas: resolvedAreasOutputSchema.optional(),
        }),
        toolErrorSchema,
    ]);

/** Output schema built with no feature flags set. */
export const discoverPlacesOutputSchema = buildDiscoverPlacesOutputSchema({});

// --- schema builders ---
//
// `within` fields are shared with getTrafficIncidents and are imported from schema.ts, so both
// tools build their `within` schemas from the same field definitions.

// `within` mode for discoverPlaces — plural-form fields. Either `viewport` alone, or any
// combination of the multi-region fields. `viewport` is mutually exclusive with everything else.
const buildDiscoverWithinWhereSchema = (_flags: FeatureFlags) =>
    z.object(sharedWithinFields).refine(
        (data) => {
            const hasViewport = data.viewport === true;
            const hasMulti =
                data.queries !== undefined ||
                data.placeIds !== undefined ||
                data.geometries !== undefined ||
                data.range !== undefined ||
                data.route !== undefined;
            if (hasViewport && hasMulti) return false;
            return hasViewport || hasMulti;
        },
        {
            message:
                '`within` requires EITHER `viewport: true` OR one or more multi-region fields ' +
                '(queries / placeIds / geometries / range / route), not both.',
        },
    );

// Route-relative ranked-detour scope. Dispatches to a different SDK endpoint (alongRouteSearch).
const maxDetourWhereSchema = z.object({
    mode: z.literal('maxDetour'),
    routeId: z
        .string()
        .optional()
        .describe('Route entry ID (e.g. "routes-0"). Use recallState. Default: latest route.'),
    maxDetourTimeSeconds: z
        .number()
        .positive()
        .describe('Max extra travel time (seconds) the user accepts to reach a POI.'),
    sortBy: z
        .enum(['detourTime', 'detourOffset'])
        .optional()
        .describe('"detourTime" (default) ranks by extra travel time; "detourOffset" by distance from the route line.'),
    limit: z
        .number()
        .max(100)
        .optional()
        .describe('Max results. Default: 10. Use this mode for short ranked lists, not bulk discovery.'),
});

export const buildDiscoverPlacesWhereSchema = (flags: FeatureFlags) => {
    const withinFieldList = 'queries/placeIds/geometries/range/route';
    return z
        .union([buildDiscoverWithinWhereSchema(flags), nearbyWhereSchema, maxDetourWhereSchema, globalWhereSchema])
        .describe(
            'Geographic scope, by `mode`: ' +
                `\`within\` (area — \`viewport\` alone, OR any combo of ${withinFieldList}) | ` +
                '`nearby` (point bias — position/viewport/query, optional radiusMeters) | ' +
                '`maxDetour` (ranked detour list off a route) | `global` (no bias). ' +
                'Default: `{ mode: "within", viewport: true }`.',
        );
};

/**
 * Tool schema for discovering places. Built from {@link FeatureFlags} so the LLM only sees
 * fields the underlying search backend actually supports.
 */
export const buildDiscoverPlacesSchema = (flags: FeatureFlags) => {
    const baseShape = {
        query: z
            .string()
            .optional()
            .describe(
                'Free-text filter on POI name/address. ' +
                    'NEVER a city/region/area name (e.g. "Paris", "Amsterdam") — those go in `where`. ' +
                    'For "restaurants in Paris": `query` is empty (or a name filter like "pizza"), `where.queries: [{query: "Paris"}]`. ' +
                    'Omit when filtering by category — use `poiCategories` instead.',
            ),
        where: buildDiscoverPlacesWhereSchema(flags).optional(),
        poiCategories: z
            .array(z.string())
            .optional()
            .describe(
                'CONSTANT_CASE category codes. ALWAYS batch all requested categories in ONE array — never one call per category. ' +
                    'Common: "RESTAURANT", "CAFE", "BAR", "HOTEL", "PARK", "PARK_RECREATION_AREA", ' +
                    '"ELECTRIC_VEHICLE_STATION", "GAS_STATION", "PARKING_GARAGE", ' +
                    '"SUPERMARKETS_HYPERMARKETS", "PHARMACY", "ATM". ' +
                    'For anything else, call getPOICategoryCodes first to resolve natural-language terms (e.g. "italian food", "gym").',
            ),
        show: showPlacesSchema
            .optional()
            .describe(
                'Display places/geometries on the map. ' +
                    'Skip for intermediate results — let the follow-up (processData / analyseData) render the final entry.',
            ),
        entryId: placesEntryIdHintSchema,
        geometries: showPlaceGeometriesSchema,
    };

    return z.object(baseShape).refine((data) => !!data.query || !!data.poiCategories?.length, {
        message:
            'discoverPlaces needs a search subject: set `query` (free-text) or `poiCategories`. ' +
            'For a single named place (no filter), use locatePlace — including for its boundary polygon (`geometry`).',
    });
};

export const buildDiscoverPlacesDescription = (_flags: FeatureFlags): string => {
    const withinFieldList = 'queries/placeIds/geometries/range/route';
    const preferLine = 'Prefer `queries` / `placeIds` (resolve to precise polygons) over raw `geometries`. ';
    return (
        'Search for MULTIPLE places in a region — REQUIRES a search subject (`query` and/or `poiCategories`). ' +
        'NOT for a single named place — use locatePlace for that (including its polygon/boundary via `geometry`). ' +
        'Stores an entry and returns `placesEntryId`. ' +
        'CALL ONCE PER REQUEST — batch all `poiCategories` + areas in one call; split only for explicitly comparable result sets. ' +
        `\`where.mode\`: \`within\` (\`viewport\` OR any combo of ${withinFieldList}), ` +
        '`nearby` (position/viewport/query + optional radiusMeters), `maxDetour` (≤100 ranked detours off a route), `global`. ' +
        preferLine +
        'Route: `within.route` = corridor scan; `maxDetour` = ranked detour list. Both cap at 100 results. ' +
        'Default: `{ mode: "within", viewport: true }`. ' +
        'Never call this with empty `query` AND empty `poiCategories` — that is locatePlace territory.'
    );
};

// Instances used by the registry's static {@link DEFAULT_TOOLS} and re-exported for any direct
// consumers.
const DEFAULT_FLAGS: FeatureFlags = {};

/**
 * Input schema for the discover-places tool.
 * Use {@link buildDiscoverPlacesSchema} to build a flag-aware variant.
 */
export const discoverPlacesSchema = buildDiscoverPlacesSchema(DEFAULT_FLAGS);

/** Tool description for the discover-places tool. */
export const discoverPlacesDescription = buildDiscoverPlacesDescription(DEFAULT_FLAGS);

// What the `where` resolvers produce before a backend is picked: at most one of the two, but which
// one depends on the mode, so it stays loose until `toGeoBias` commits it to the service's union.
type WhereBias = { boundingBox?: HasBBox; position?: Position };

const toGeoBias = (bias: WhereBias | undefined, radiusMeters: number | undefined): GeoBias | undefined => {
    if (bias?.position) return { position: bias.position, radiusMeters };

    return bias?.boundingBox ? { boundingBox: bias.boundingBox } : undefined;
};

type MultiFilters = {
    boundingBoxes?: HasBBox[];
    geometries?: (Polygon | MultiPolygon)[];
};

type DiscoverPlacesWhere = z.infer<ReturnType<typeof buildDiscoverPlacesWhereSchema>>;
type DiscoverWithinWhere = z.infer<ReturnType<typeof buildDiscoverWithinWhereSchema>>;
type NearbyWhere = z.infer<typeof nearbyWhereSchema>;
type MaxDetourWhere = z.infer<typeof maxDetourWhereSchema>;

const searchByDetour = async (
    state: ToolState,
    detour: MaxDetourWhere,
    query: string | undefined,
    resolvedPoiCategories: POICategory[] | undefined,
    entryId: string | undefined,
    options?: ToolExecuteOptions,
): Promise<{ result: Awaited<ReturnType<typeof alongRouteSearch>>; placesEntryId: string } | { error: string }> => {
    const entries = state.routing.entries;
    if (entries.length === 0) {
        return { error: 'No routes in state. Calculate a route first via setRoute.' };
    }
    const routeEntry = detour.routeId ? entries.find((e) => e.id === detour.routeId) : entries.at(-1);
    if (!routeEntry) {
        return { error: `No route found with id "${detour.routeId}". Use recallState to list available routes.` };
    }
    const routeFeature = routeEntry.data.features[0];
    if (!routeFeature) {
        return { error: `Route entry "${routeEntry.id}" has no geometry.` };
    }

    const requestParams = withAgentToolkitHeaders({
        route: routeFeature,
        maxDetourTimeSeconds: detour.maxDetourTimeSeconds,
        ...(query && { query }),
        ...(resolvedPoiCategories && { poiCategories: resolvedPoiCategories }),
        ...(detour.sortBy && { sortBy: detour.sortBy }),
        ...(detour.limit !== undefined && { limit: detour.limit }),
        signal: options?.signal,
    });
    const result = await alongRouteSearch(requestParams);
    const placesEntryId = await state.places.addPlaceResult(
        result,
        makePlacesLabel(result, { query, poiCategories: resolvedPoiCategories, routeLabel: routeEntry.label }),
        entryId,
    );
    return { result, placesEntryId };
};

// `search` consumes only `geometries` out of `MultiFilters`; `boundingBoxes` are merged into the
// bias by the callers that collect them.
const searchGeometries = (filters: MultiFilters): { geometries?: (Polygon | MultiPolygon)[] } => {
    const { geometries } = filters;
    return geometries?.length ? { geometries } : {};
};

// Single dispatch point for the places search backend, so every caller shares one `limit` cap and
// one filter projection.
const dispatchPlacesSearch = (
    params: {
        query: string | undefined;
        poiCategories: POICategory[] | undefined;
        bias?: WhereBias;
        radiusMeters?: number;
        multiFilters: MultiFilters;
    },
    options?: ToolExecuteOptions,
): Promise<Awaited<ReturnType<typeof search>>> => {
    const { query, poiCategories, bias, radiusMeters, multiFilters } = params;
    const geoBias = toGeoBias(bias, radiusMeters);
    const requestParams = withAgentToolkitHeaders({
        query,
        poiCategories,
        signal: options?.signal,
        limit: 100,
        ...searchGeometries(multiFilters),
        ...(geoBias && { geoBias }),
    });
    return search(requestParams);
};

// What both dispatch branches need. Each branch adds its own on top: `searchInRange`
// a range id, `searchWithBias` the bias it resolved.
type DispatchBranchParams = {
    state: ToolState;
    query: string | undefined;
    resolvedPoiCategories: POICategory[] | undefined;
    multiFilters: MultiFilters;
    entryId: string | undefined;
    routeLabel: string | undefined;
};

const searchInRange = async (
    params: DispatchBranchParams & { range: string },
    options?: ToolExecuteOptions,
): Promise<{ result: Awaited<ReturnType<typeof search>>; placesEntryId: string } | { error: string }> => {
    const { state, range, query, resolvedPoiCategories, multiFilters, entryId, routeLabel } = params;
    // Combine every range's polygon into the search bias so multi-origin entries search the union
    // of their reachable areas.
    const ranged = getRangePolygons(state, range);
    if ('error' in ranged) return ranged;
    const combinedGeometries = [...ranged.polygons, ...(multiFilters.geometries ?? [])];
    const result = await dispatchPlacesSearch(
        {
            query,
            poiCategories: resolvedPoiCategories,
            multiFilters: { ...multiFilters, geometries: combinedGeometries },
        },
        options,
    );
    const placesEntryId = await state.places.addPlaceResult(
        result,
        makePlacesLabel(result, {
            query,
            poiCategories: resolvedPoiCategories,
            ...(routeLabel && { routeLabel }),
        }),
        entryId,
    );
    return { result, placesEntryId };
};

// Resolves a discoverPlaces `within` mode to the search params it should run with. Either the
// `viewport` bias path, or the multi-region path (any combo of queries / placeIds / geometries /
// range / route). The two paths are mutually exclusive at the schema level — see the refinement on
// `buildDiscoverWithinWhereSchema`.
type WithinResolution = {
    bias: WhereBias;
    multiFilters: MultiFilters;
    range?: string;
    routeLabel?: string;
    // Where each named query actually resolved — the grounded match (e.g. "restaurants in east
    // London" → "London, CA"). Empty on the viewport path (no named query to mis-resolve) and on raw
    // bbox/geometry input.
    resolvedAreas?: ResolvedAreaDisclosure[];
};

const resolveDiscoverWithin = async (
    where: DiscoverWithinWhere,
    state: ToolState,
    baseFilters: MultiFilters,
    options?: ToolExecuteOptions,
): Promise<WithinResolution | { error: string }> => {
    if (where.viewport) {
        return {
            bias: { boundingBox: getViewportBoundingBox(state.baseMap) },
            multiFilters: baseFilters,
        };
    }

    // Resolve queries / placeIds / geometries / route via the shared resolver. resolveWithin returns
    // an empty area set (not an error) when nothing resolved, so a range-only within — whose scope is
    // carried below — composes fine here.
    const within = await resolveWithin(
        {
            boundingBox: undefined,
            queries: where.queries,
            placeIds: where.placeIds,
            geometries: where.geometries,
            route: where.route,
        },
        toolStateToWhereContext(state, options),
    );
    if (isResolveError(within)) return within;
    const resolvedGeometries = within.filter((a) => a.polygon).map((a) => a.polygon as Polygon | MultiPolygon);
    const resolvedBoundingBoxes = within.filter((a) => !a.polygon).map((a) => a.bbox);
    const routeLabel = within.find((a) => a.source === 'route')?.label;
    // Surface where each named query resolved — the grounded match (mirrors getTrafficIncidents), so
    // the agent can confirm/correct a wrong same-name area.
    const resolvedAreas = within
        .filter((a) => a.source === 'query' && a.label)
        .map((a) => ({ matched: a.label as string, ...(a.query !== undefined && { query: a.query }) }));

    const mergedBoundingBoxes: HasBBox[] = [...(resolvedBoundingBoxes as HasBBox[])];
    const mergedGeometries: (Polygon | MultiPolygon)[] = [...resolvedGeometries];

    const multiFilters: MultiFilters = {
        ...baseFilters,
        ...(mergedBoundingBoxes.length && { boundingBoxes: mergedBoundingBoxes }),
        ...(mergedGeometries.length && { geometries: mergedGeometries }),
    };

    // An area that resolves without a boundary polygon contributes only a bbox, and the search
    // dispatch consumes `geometries` alone. Without a bbox bias here a bbox-only resolution would
    // run unscoped — a global search wearing the label of the area the user named. When polygons
    // did resolve they carry the scope instead, and any bbox-only area alongside them is dropped:
    // narrower than asked for, which is the safer of the two ways to be wrong.
    const scopeBoundingBox = mergedGeometries.length ? undefined : bboxFromBBoxes(resolvedBoundingBoxes);

    return {
        bias: scopeBoundingBox ? { boundingBox: scopeBoundingBox } : {},
        multiFilters,
        range: where.range,
        routeLabel,
        ...(resolvedAreas.length > 0 && { resolvedAreas }),
    };
};

// Resolves a `nearby` bias to a position (and optional radius cap) via the shared resolver. A
// `query` bias surfaces where it resolved (`resolvedAreas`, mirrors the within-query path) — a bias
// landing on a same-named place elsewhere silently skews the results to the wrong locale.
const resolveNearbyBias = async (
    where: NearbyWhere,
    state: ToolState,
    options?: ToolExecuteOptions,
): Promise<{ bias: WhereBias; radiusMeters?: number; resolvedAreas?: ResolvedAreaDisclosure[] }> => {
    // `position` is a literal point — nothing to resolve, so it never goes through resolveNearby.
    if (where.position) {
        return { bias: { position: where.position }, radiusMeters: where.radiusMeters };
    }
    const resolved = await resolveNearby(
        {
            viewport: where.viewport,
            queries: where.query ? [{ query: where.query, queryAs: where.queryAs }] : undefined,
        },
        toolStateToWhereContext(state, options),
    );
    const resolvedAreas = resolved.label
        ? [{ matched: resolved.label, ...(resolved.query !== undefined && { query: resolved.query }) }]
        : [];
    return {
        bias: resolved.position ? { position: resolved.position } : {},
        radiusMeters: where.radiusMeters,
        ...(resolvedAreas.length > 0 && { resolvedAreas }),
    };
};

type ResolvedDiscoverBias = {
    bias: WhereBias;
    multiFilters: MultiFilters;
    radiusMeters?: number;
    range?: string;
    routeLabel?: string;
    resolvedAreas?: ResolvedAreaDisclosure[];
};

// Dispatch the `where` mode to its dedicated resolver. `maxDetour` is handled separately by the
// caller (different SDK endpoint); `global` falls through with an empty bias.
const resolveDiscoverBias = async (
    effectiveWhere: DiscoverPlacesWhere,
    state: ToolState,
    baseMultiFilters: MultiFilters,
    options?: ToolExecuteOptions,
): Promise<ResolvedDiscoverBias | { error: string }> => {
    if (effectiveWhere.mode === 'nearby') {
        const nearby = await resolveNearbyBias(effectiveWhere, state, options);
        return {
            bias: nearby.bias,
            multiFilters: baseMultiFilters,
            radiusMeters: nearby.radiusMeters,
            resolvedAreas: nearby.resolvedAreas,
        };
    }
    if (effectiveWhere.mode === 'within') {
        const resolved = await resolveDiscoverWithin(effectiveWhere, state, baseMultiFilters, options);
        if ('error' in resolved) return resolved;
        return {
            bias: resolved.bias,
            multiFilters: resolved.multiFilters,
            range: resolved.range,
            routeLabel: resolved.routeLabel,
            resolvedAreas: resolved.resolvedAreas,
        };
    }
    // mode === 'global'
    return { bias: {}, multiFilters: baseMultiFilters };
};

// Geocoded place names produce a human-readable label suffix on the entry.
const resolveWhereLabel = (where: DiscoverPlacesWhere | undefined): string | undefined => {
    if (!where) return undefined;
    if (where.mode === 'within' && where.queries?.length) return where.queries.map((q) => q.query).join(', ');
    if (where.mode === 'nearby' && where.query) return where.query;
    return undefined;
};

const searchWithBias = async (
    params: DispatchBranchParams & {
        bias: WhereBias;
        radiusMeters: number | undefined;
        whereLabel: string | undefined;
    },
    options?: ToolExecuteOptions,
): Promise<{ result: Awaited<ReturnType<typeof search>>; placesEntryId: string }> => {
    const { state, query, bias, resolvedPoiCategories, radiusMeters, multiFilters, entryId, whereLabel, routeLabel } =
        params;
    const result = await dispatchPlacesSearch(
        {
            query,
            poiCategories: resolvedPoiCategories,
            bias,
            radiusMeters,
            multiFilters,
        },
        options,
    );
    const placesEntryId = await state.places.addPlaceResult(
        result,
        makePlacesLabel(result, {
            query,
            poiCategories: resolvedPoiCategories,
            where: whereLabel,
            ...(routeLabel && { routeLabel }),
        }),
        entryId,
    );
    return { result, placesEntryId };
};

// Render-on-map + boundary-geometry post-processing shared by every dispatch branch.
const finalizeDiscoverResult = async (
    state: ToolState,
    result: Awaited<ReturnType<typeof search>>,
    placesEntryId: string,
    show: z.infer<ReturnType<typeof buildDiscoverPlacesSchema>>['show'],
    geometries: z.infer<ReturnType<typeof buildDiscoverPlacesSchema>>['geometries'],
    flags: FeatureFlags,
    resolvedAreas?: ResolvedAreaDisclosure[],
    options?: ToolExecuteOptions,
) => {
    const shown = show ? await showResultsOnMap(state, [placesEntryId], show) : undefined;

    let geometriesFetched: number | undefined;
    let geometriesShown: boolean | undefined;
    if (geometries) {
        const geometryResult = await showEntryGeometries(state, placesEntryId, geometries, options);
        geometriesFetched = geometryResult.fetched;
        if (geometryResult.shown) geometriesShown = true;
    }

    const label = state.places.entries.find((entry) => entry.id === placesEntryId)?.label;

    return {
        ...summarizePlaces(result),
        placesEntryId,
        ...(label && { label }),
        ...(shown && { shown }),
        ...(geometriesFetched !== undefined && { geometriesFetched }),
        ...(geometriesShown !== undefined && { geometriesShown }),
        ...(resolvedAreas && resolvedAreas.length > 0 && { resolvedAreas }),
    };
};

/**
 * Build the discoverPlaces executor for a given {@link FeatureFlags} bag. Every search call goes
 * through the {@link search} router.
 */
export const buildExecuteDiscoverPlaces = (flags: FeatureFlags) => {
    return async (
        params: z.infer<ReturnType<typeof buildDiscoverPlacesSchema>>,
        state: ToolState,
        options?: ToolExecuteOptions,
    ): Promise<z.infer<typeof discoverPlacesOutputSchema>> => {
        const { query, where, poiCategories, show, entryId, geometries } = params;

        // Resolve once upstream — exact catalog codes pass through, natural-language terms are
        // synonym-resolved via getPOICategoryCodes. We only error when the LLM passed inputs and
        // NONE matched anything, since a no-filter search would silently widen the result set.
        // Note: this trades a hard error for confusable inputs (e.g. "PARKING_LOT" → parking codes
        // when the user meant parks); we accept that and rely on the description hints to steer
        // the LLM toward the right codes up-front.
        const { resolved: resolvedPoiCategories, unresolved } = await resolvePoiCategories(poiCategories, options);
        if (poiCategories?.length && !resolvedPoiCategories) {
            return {
                error:
                    `No POI categories matched: ${unresolved.map((c) => `"${c}"`).join(', ')}. ` +
                    'POI category codes must be exact CONSTANT_CASE values, or natural-language terms resolvable by the SDK catalog. ' +
                    'Call getPOICategoryCodes to find valid codes for your search subject (e.g. "italian food", "gym").',
            };
        }

        // Default to viewport-bounded when no `where` was supplied.
        const effectiveWhere: DiscoverPlacesWhere = where ?? { mode: 'within', viewport: true };
        const baseMultiFilters: MultiFilters = {};

        try {
            // maxDetour dispatches to a different SDK endpoint and shares no params with the rest.
            if (effectiveWhere.mode === 'maxDetour') {
                const detourResult = await searchByDetour(
                    state,
                    effectiveWhere,
                    query,
                    resolvedPoiCategories,
                    entryId,
                    options,
                );
                if ('error' in detourResult) return detourResult;
                return finalizeDiscoverResult(
                    state,
                    detourResult.result,
                    detourResult.placesEntryId,
                    show,
                    geometries,
                    flags,
                    undefined,
                    options,
                );
            }

            const resolved = await resolveDiscoverBias(effectiveWhere, state, baseMultiFilters, options);
            if ('error' in resolved) return resolved;
            const { bias, multiFilters, radiusMeters, range, routeLabel, resolvedAreas } = resolved;

            if (range) {
                const rangeResult = await searchInRange(
                    { state, range, query, resolvedPoiCategories, multiFilters, entryId, routeLabel },
                    options,
                );
                if ('error' in rangeResult) return rangeResult;
                return finalizeDiscoverResult(
                    state,
                    rangeResult.result,
                    rangeResult.placesEntryId,
                    show,
                    geometries,
                    flags,
                    resolvedAreas,
                    options,
                );
            }

            // Prefer the grounded match ("London, CA") over the query echo ("east London") in the
            // entry label so the chip never masks a wrong same-name resolution.
            const groundedLabel = resolvedAreas?.length ? resolvedAreas.map((a) => a.matched).join(', ') : undefined;
            const whereLabel = groundedLabel ?? resolveWhereLabel(effectiveWhere);
            const biasResult = await searchWithBias(
                {
                    state,
                    query,
                    bias,
                    resolvedPoiCategories,
                    radiusMeters,
                    multiFilters,
                    entryId,
                    whereLabel,
                    routeLabel,
                },
                options,
            );
            return finalizeDiscoverResult(
                state,
                biasResult.result,
                biasResult.placesEntryId,
                show,
                geometries,
                flags,
                resolvedAreas,
                options,
            );
        } catch (error) {
            return { error: `Search failed: ${error instanceof Error ? error.message : String(error)}` };
        }
    };
};

/** Executor for the discover-places tool, built with no feature flags set. */
export const executeDiscoverPlaces = buildExecuteDiscoverPlaces(DEFAULT_FLAGS);

/**
 * Build a complete {@link ToolEntry} for `discoverPlaces` for the given {@link FeatureFlags}.
 * Description, schema, and executor are all picked from the same flag set so they always agree.
 *
 * Anything other than schema/description/execute (tags, examples, examplePrompts, related/depends)
 * is supplied by the caller via `metadata` so the registry retains a single source of truth.
 */
export const buildDiscoverPlacesEntry = <S extends ToolState = ToolState>(
    flags: FeatureFlags,
    metadata: Omit<ToolEntry<S>, 'description' | 'inputSchema' | 'outputSchema' | 'execute'>,
): ToolEntry<S> => ({
    ...metadata,
    description: buildDiscoverPlacesDescription(flags),
    inputSchema: buildDiscoverPlacesSchema(flags),
    outputSchema: buildDiscoverPlacesOutputSchema(flags),
    execute: buildExecuteDiscoverPlaces(flags) as ToolEntry<S>['execute'],
});

// Flag-agnostic metadata for the discover-places tool. Description, schema, and executor are
// flag-aware and produced by the builder below.
const discoverPlacesMetadata = {
    classificationPrompt:
        'Search multiple places by query/category in a region. BATCH categories+areas in one call. ' +
        '`query` filters POI names ONLY — area names go in `where`. ' +
        '`where.mode`: within (area) / nearby (point bias) / maxDetour (route-relative ranked) / global. ' +
        'For "X in [named area]", put X in top-level `query`/`poiCategories` and the area in `where.queries: [{query: "..."}]` — geocoded in one step, no precursor locatePlace. ' +
        'Within-mode: route → corridor. Prefer geometries/placeIds over bbox. ' +
        'Also OWNS outlining the SUB-AREAS of a place — the neighbourhoods/districts of a city ("outline the ' +
        'Amsterdam neighbourhoods"); a SINGLE named place\'s own boundary is locatePlace, and incrementally ' +
        'adding/removing outlines among already-shown places is updatePlacesDisplay. ' +
        'Skip for already-stored places — use recallState/processData.',
    tags: ['discover', 'place', 'location'],
    examples: [
        'discoverPlaces({ poiCategories: ["RESTAURANT", "CAFE", "BAR"], entryId: "amsterdam-food-spots" })  // batch many categories + semantic id',
        'discoverPlaces({ query: "coffee", where: { mode: "nearby", position: [4.9, 52.4], radiusMeters: 500 } })',
        'discoverPlaces({ query: "parking", where: { mode: "within", queries: [{ query: "De Jordaan, Amsterdam", queryAs: "place" }] } })  // area name goes in `where.queries`, NOT top-level `query`',
        'discoverPlaces({ query: "coffee", where: { mode: "nearby", query: "Schiphol Airport", queryAs: "poi", radiusMeters: 2000 } })  // POI-resolved bias point',
        'discoverPlaces({ poiCategories: ["HOTEL"], where: { mode: "within", queries: [{ query: "Amsterdam" }, { query: "Utrecht" }] }, entryId: "ams-utrecht-hotels" })',
        'discoverPlaces({ query: "bakery", where: { mode: "within", range: "ranges-0" } })',
        'discoverPlaces({ poiCategories: ["CAFE"], show: { markerType: "pin", zoomMode: "auto" } })  // omit `where` → defaults to viewport',
        'discoverPlaces({ poiCategories: ["RESTAURANT"], where: { mode: "within", queries: [{ query: "Paris" }] } })  // "restaurants in Paris" — subject in `poiCategories`, area in `where.queries`',
        'discoverPlaces({ poiCategories: ["ELECTRIC_VEHICLE_STATION"], where: { mode: "within", route: { routeId: "routes-0", widthMeters: 1000 } } })  // corridor scan along the route',
        'discoverPlaces({ query: "coffee", where: { mode: "maxDetour", maxDetourTimeSeconds: 300, limit: 5 } })  // top 5 coffee detours within 5 min off the latest route',
        'discoverPlaces({ poiCategories: ["ELECTRIC_VEHICLE_STATION"], where: { mode: "maxDetour", routeId: "routes-1", maxDetourTimeSeconds: 600, sortBy: "detourOffset" } })  // ranked EV detours on a specific route',
        'discoverPlaces({ query: "bakery", where: { mode: "within", placeIds: ["G55fc4abe-..."] } })  // search inside stored place polygons (auto-fetched if needed)',
        'discoverPlaces({ query: "vegan", where: { mode: "global" } })',
    ],
    examplePrompts: [
        'Find coffee shops near me',
        'Italian restaurants in Amsterdam',
        'EV chargers in the current map area',
        'Hotels in Amsterdam and Utrecht',
        'Bakeries within the reachable range',
        'Outline the Amsterdam neighbourhoods',
        // "Show the boundaries of Amsterdam and Utrecht" lives on locatePlace now — outlining two
        // WHOLE named cities is locatePlace's repeated `geometry: { mode: "add" }` path, which the
        // classifier (rightly) prefers over a discoverPlaces area search.
        'Search for EV chargers in a corridor along my planned route',
        'Cafes in a 500 m corridor around the planned route',
        'Best 5 coffee stops without losing more than 5 min off my route',
        'EV chargers I can reach with under 10 min detour',
        // Family / errand-runner persona: category search biased to an area or nearby point.
        'Find playgrounds in this neighbourhood',
        'Show pharmacies near Berlin Hauptbahnhof',
    ],
    relatedTools: [
        'getPOICategoryCodes',
        'updatePlacesDisplay',
        'locatePlace',
        'getViewport',
        'findReachableAreas',
        'processData',
        'analyseData',
    ],
    dependsOn: ['getPOICategoryCodes', 'setRoute'],
} satisfies Omit<ToolEntry, 'description' | 'inputSchema' | 'outputSchema' | 'execute'>;

/**
 * Builder for the `discoverPlaces` default tool entry. Reads {@link FeatureFlags}
 * from the build options to pick the matching description, schema, and executor;
 * static metadata (tags, examples, related/depends) is colocated here as the
 * single source of truth.
 */
export const discoverPlacesBuilder: ToolEntryBuilder = (options) =>
    buildDiscoverPlacesEntry(options.featureFlags ?? {}, discoverPlacesMetadata);
