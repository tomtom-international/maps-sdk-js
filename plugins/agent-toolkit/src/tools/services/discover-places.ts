/**
 * @module agent-toolkit-tools
 */

import { getPosition, type HasBBox, type Place, type POICategory } from '@tomtom-org/maps-sdk/core';
import {
    alongRouteSearch,
    explorationSearch,
    geometryData,
    POPULATED_AREA_TAGS,
    type PopulatedAreaTag,
    search,
} from '@tomtom-org/maps-sdk/services';
import * as turf from '@turf/turf';
import type { Feature, MultiPolygon, Polygon, Position } from 'geojson';
import { z } from 'zod';
import type { FeatureFlags, ToolEntry, ToolEntryBuilder, ToolState } from '../../types';
import { makePlacesLabel, summarizePlaces } from '../../utils';
import {
    geoJsonBBoxSchema,
    geometryInputSchema,
    getViewportBias,
    getViewportBoundingBox,
    globalWhereSchema,
    nearbyWhereSchema,
    placesEntryIdHintSchema,
    queryAsSchema,
    resolvePoiCategories,
    showEntryGeometries,
    shownSchema,
    showPlaceGeometriesSchema,
    showPlacesSchema,
    showResultsOnMap,
    withinSharedFields,
} from '../shared';
import { buildPlacesOutputSchema, toolErrorSchema } from '../shared-output-schemas';
import { locatePlace, locatePlaces, type QueryAs } from './locate-place';

// Number of candidate places to consider when resolving `where.query` — a precise polygon often
// lives a few results down the list (e.g. a street POI may rank above the neighbourhood it sits in).
const WITHIN_QUERY_CANDIDATE_LIMIT = 5;

// `where.query` resolution for the within branch — geocodes (or POI-searches) the query, then
// returns the first candidate that exposes a geometry data source (with its boundary polygon
// fetched). Falls back to the top result when no candidate has a polygon. Discover-places owns
// this helper because the polygon is consumed as a precise `geometries` filter on the search;
// locate-place only needs a coarse bias bbox and skips the extra fetch.
const resolveQueryToWithinArea = async (
    query: string,
    queryAs: QueryAs,
    biasPosition?: Position,
): Promise<{ place: Place; geometry?: Feature<Polygon | MultiPolygon> } | null> => {
    const places = await locatePlaces(query, queryAs, {
        limit: WITHIN_QUERY_CANDIDATE_LIMIT,
        bias: biasPosition ? { position: biasPosition } : undefined,
    });
    if (places.length === 0) return null;

    for (const place of places) {
        if (!place.properties.dataSources?.geometry?.id) continue;
        const result = await geometryData({ geometries: [place] });
        const feature = result.features[0];
        if (feature) return { place, geometry: feature as Feature<Polygon | MultiPolygon> };
    }

    return { place: places[0] };
};

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
        }),
        toolErrorSchema,
    ]);

/** Default-flag (`experimentalSearch: false`) output schema. */
export const discoverPlacesOutputSchema = buildDiscoverPlacesOutputSchema({});

// --- schema builders ---
//
// The `discoverPlaces` schema differs slightly between the stable default search backend and the
// experimental exploration-search backend. To keep the two variants in lockstep, every shared
// piece is defined ONCE below and composed into either variant via the `experimentalSearch` flag.
// Only the explorationSearch-only fields (`municipalities`, `boundingBoxes`, top-level
// `placeTypes`) live behind the flag.

// `within` fields shared between both variants. Both consume `withinSharedFields` (`mode` +
// `viewport`) plus the multi-region fields whose values resolve to geometries the default search
// backend can also consume (`queries`, `placeIds`, `geometries`, `range`, `route`).
const sharedWithinFields = {
    ...withinSharedFields,
    queries: z
        .array(
            z.object({
                query: z
                    .string()
                    .describe(
                        'Name of a CONTAINING area to search within (e.g. "Paris", "De Jordaan, Amsterdam"). ' +
                            "NEVER the user's search subject — that goes in the top-level `query`.",
                    ),
                queryAs: queryAsSchema,
            }),
        )
        .optional()
        .describe(
            'CONTAINING areas to search WITHIN — answers "search where?", NOT "search for what?". ' +
                "Never put the user's search subject here. " +
                'Example: for "cafes in Amsterdam" → top-level `query`/`poiCategories` carry "cafes"; ' +
                '`where.queries: [{query: "Amsterdam"}]` carries the region. ' +
                'Each entry resolves to a boundary polygon (or bbox); the union is searched. ' +
                'Per-item `queryAs` disambiguates POI vs place. ' +
                'EXCLUSIVE with viewport; composes with other multi-region fields.',
        ),
    placeIds: z
        .array(z.string())
        .optional()
        .describe(
            'IDs of session places — each polygon (fetched on demand) joins the search area. ' +
                'Use recallPlaces to list IDs. ' +
                'EXCLUSIVE with viewport; composes with other multi-region fields.',
        ),
    geometries: z
        .array(geometryInputSchema)
        .optional()
        .describe(
            'Direct GeoJSON Polygons / MultiPolygons (custom drawing, external data). ' +
                'For named or stored places use `queries` / `placeIds`. ' +
                'EXCLUSIVE with viewport; composes with other multi-region fields.',
        ),
    range: z
        .string()
        .optional()
        .describe(
            'Range ID from findReachableAreas (e.g. "ranges-0") — restricts to that entry; ' +
                'multi-origin entries combine their polygons. Use recallRanges to list IDs. ' +
                'EXCLUSIVE with viewport; composes with other multi-region fields.',
        ),
    route: z
        .object({
            routeId: z
                .string()
                .optional()
                .describe('Route entry ID (e.g. "routes-0"). Use recallRoutes. Default: latest route.'),
            widthMeters: z
                .number()
                .positive()
                .describe(
                    'Total corridor width (metres) — widthMeters/2 each side. ' +
                        'Typical: 200–500 m ("near the road"), 2–5 km ("broad area along the route").',
                ),
        })
        .optional()
        .describe(
            'Buffered corridor around a stored route — turf.buffer at widthMeters/2 around the line. ' +
                'BULK discovery (≤10000); for a SHORT ranked detour list use mode `maxDetour`. ' +
                'EXCLUSIVE with viewport; composes with other multi-region fields.',
        ),
};

// explorationSearch-only `within` fields. The default search backend has no equivalent for these.
const experimentalWithinFields = {
    boundingBoxes: z
        .array(geoJsonBBoxSchema)
        .optional()
        .describe(
            'Bboxes [W,S,E,N] — results in the union. ' +
                'Last-resort: prefer `municipalities` / `queries` / `placeIds` / `geometries` when polygons are resolvable. ' +
                'EXCLUSIVE with viewport; composes with other multi-region fields.',
        ),
    municipalities: z
        .array(z.string())
        .optional()
        .describe(
            'Exact, case-sensitive municipality names (e.g. ["Amsterdam", "Utrecht"]). ' +
                'EXCLUSIVE with viewport; composes with other multi-region fields.',
        ),
    areaId: z
        .string()
        .optional()
        .describe(
            'Id of a small area polygon (few km², not a whole municipality) — restricts results to that single area. ' +
                'Typically chained from a previous hit\'s `areaId` ("what else is in this same area?"). ' +
                'EXCLUSIVE with viewport; composes with other multi-region fields.',
        ),
};

// `within` mode for discoverPlaces — plural-form fields. Either `viewport` alone, or any
// combination of the multi-region fields. `viewport` is mutually exclusive with everything else.
const buildDiscoverWithinWhereSchema = (flags: FeatureFlags) =>
    z
        .object(flags.experimentalSearch ? { ...sharedWithinFields, ...experimentalWithinFields } : sharedWithinFields)
        .refine(
            (data) => {
                const hasViewport = !!data.viewport;
                const experimentalData = data as {
                    municipalities?: string[];
                    boundingBoxes?: unknown[];
                    areaId?: string;
                };
                const hasMulti =
                    !!data.queries?.length ||
                    !!data.placeIds?.length ||
                    !!data.geometries?.length ||
                    !!data.range ||
                    !!data.route ||
                    // Experimental-only fields — `data` is loosely typed because of the optional
                    // intersection. Treat absent fields as empty.
                    !!experimentalData.municipalities?.length ||
                    !!experimentalData.boundingBoxes?.length ||
                    !!experimentalData.areaId;
                if (hasViewport && hasMulti) return false;
                return hasViewport || hasMulti;
            },
            {
                message:
                    '`within` requires EITHER `viewport: true` OR one or more multi-region fields ' +
                    '(queries / placeIds / geometries / range / route' +
                    (flags.experimentalSearch ? ' / boundingBoxes / municipalities / areaId' : '') +
                    '), not both.',
            },
        );

// Route-relative ranked-detour scope. Dispatches to a different SDK endpoint (alongRouteSearch).
const maxDetourWhereSchema = z.object({
    mode: z.literal('maxDetour'),
    routeId: z
        .string()
        .optional()
        .describe('Route entry ID (e.g. "routes-0"). Use recallRoutes. Default: latest route.'),
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

const buildDiscoverPlacesWhereSchema = (flags: FeatureFlags) => {
    const withinFieldList = flags.experimentalSearch
        ? 'boundingBoxes/queries/placeIds/municipalities/areaId/geometries/range/route'
        : 'queries/placeIds/geometries/range/route';
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
                    'For anything else, call getPoiCategoryCodes first to resolve natural-language terms (e.g. "italian food", "gym").',
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

    const shape = flags.experimentalSearch
        ? {
              ...baseShape,
              placeTypes: z
                  .array(z.enum(['POI', 'PointAddress', 'Street']))
                  .optional()
                  .describe(
                      'Restrict to record types (default: all). ' +
                          'POI = businesses/landmarks/amenities; PointAddress = numbered addresses; Street = unnumbered streets.',
                  ),
              areaTags: z
                  .array(z.enum(POPULATED_AREA_TAGS))
                  .optional()
                  .describe(
                      'Tokens describing a small surrounding area (few km², not a whole municipality). ' +
                          'Enum drawn from the SDK canonical vocabulary — e.g. "coastal", "walkable", "alpine", ' +
                          '"transit_connected", "village", "tourism_economy". ' +
                          'OR semantics — matches places in areas tagged with ANY token. ' +
                          'Filter works on any `where` scope (including global), but area data is currently ' +
                          'populated only for DE / NL / FR — zero hits where data is absent. ' +
                          'Filter, not a geo-bias — pair with a `where` mode that supplies one.',
                  ),
          }
        : baseShape;

    return z.object(shape).refine((data) => !!data.query || !!data.poiCategories?.length, {
        message:
            'discoverPlaces needs a search subject: set `query` (free-text) or `poiCategories`. ' +
            'For a single named place (no filter), use locatePlace — including for its boundary polygon (`geometry`).',
    });
};

export const buildDiscoverPlacesDescription = (flags: FeatureFlags): string => {
    const withinFieldList = flags.experimentalSearch
        ? 'boundingBoxes/queries/placeIds/municipalities/areaId/geometries/range/route'
        : 'queries/placeIds/geometries/range/route';
    const preferLine = flags.experimentalSearch
        ? 'Prefer `municipalities` / `areaId` / `queries` / `placeIds` (precise) over `boundingBoxes` (coarse). '
        : 'Prefer `queries` / `placeIds` (resolve to precise polygons) over raw `geometries`. ';
    const areaTagsLine = flags.experimentalSearch
        ? 'Top-level `areaTags` narrows hits by small-area character ("coastal", "walkable", …) — area data currently populated only in DE/NL/FR. '
        : '';
    return (
        'Search for MULTIPLE places in a region — REQUIRES a search subject (`query` and/or `poiCategories`). ' +
        'NOT for a single named place — use locatePlace for that (including its polygon/boundary via `geometry`). ' +
        'Stores an entry and returns `placesEntryId`. ' +
        'CALL ONCE PER REQUEST — batch all `poiCategories` + areas in one call; split only for explicitly comparable result sets. ' +
        `\`where.mode\`: \`within\` (\`viewport\` OR any combo of ${withinFieldList}), ` +
        '`nearby` (position/viewport/query + optional radiusMeters), `maxDetour` (≤100 ranked detours off a route), `global`. ' +
        preferLine +
        areaTagsLine +
        'Route: `within.route` = bulk corridor (≤10000); `maxDetour` = short ranked list (≤100). ' +
        'Default: `{ mode: "within", viewport: true }`. ' +
        'Never call this with empty `query` AND empty `poiCategories` — that is locatePlace territory.'
    );
};

// Default-flag (stable, non-experimental) instances — used by the registry's static
// {@link DEFAULT_TOOLS} and re-exported for any direct consumers.
const DEFAULT_FLAGS: FeatureFlags = {};

/**
 * Default-flag (`experimentalSearch: false`) input schema for the discover-places tool.
 * Use {@link buildDiscoverPlacesSchema} to build a flag-aware variant.
 */
export const discoverPlacesSchema = buildDiscoverPlacesSchema(DEFAULT_FLAGS);

/** Default-flag (`experimentalSearch: false`) tool description. */
export const discoverPlacesDescription = buildDiscoverPlacesDescription(DEFAULT_FLAGS);

type WhereBias = { boundingBox?: HasBBox; position?: Position };

type MultiFilters = {
    municipalities?: string[];
    boundingBoxes?: HasBBox[];
    geometries?: (Polygon | MultiPolygon)[];
    // `areaId` is a single-municipality geo-bias on the underlying explorationSearch — like
    // `municipalities` but matches by polygon id instead of name (faster + unambiguous).
    areaId?: string;
    // Not a geographic restriction — deliberately excluded from `hasMultiFilters`
    // so passing it alone still triggers the viewport-bounds default.
    placeTypes?: ('POI' | 'PointAddress' | 'Street')[];
    // Filter (not a geo-bias). Composes with any `where` scope.
    areaTags?: PopulatedAreaTag[];
};

type DiscoverPlacesWhere = z.infer<ReturnType<typeof buildDiscoverPlacesWhereSchema>>;
type DiscoverWithinWhere = z.infer<ReturnType<typeof buildDiscoverWithinWhereSchema>>;
type NearbyWhere = z.infer<typeof nearbyWhereSchema>;
type MaxDetourWhere = z.infer<typeof maxDetourWhereSchema>;

// Resolves a `withinRoute` ref to one corridor polygon per route alternative in the entry.
// A route entry may carry multiple LineString features (main + alternatives); buffering only the
// first would silently exclude POIs along alternatives. `widthMeters` is the *total* corridor
// width — half is passed to turf.buffer as the radius.
const resolveWithinRoute = (
    state: ToolState,
    withinRoute: { routeId?: string; widthMeters: number },
): { polygons: (Polygon | MultiPolygon)[]; routeLabel: string } | { error: string } => {
    const entries = state.routing.entries;
    if (entries.length === 0) {
        return { error: 'No routes in state. Calculate a route first via setRoute.' };
    }
    const entry = withinRoute.routeId ? entries.find((e) => e.id === withinRoute.routeId) : entries.at(-1);
    if (!entry) {
        return {
            error: `No route found with id "${withinRoute.routeId}". Use recallRoutes to list available routes.`,
        };
    }
    if (entry.data.features.length === 0) {
        return { error: `Route entry "${entry.id}" has no geometry.` };
    }
    const radiusMeters = withinRoute.widthMeters / 2;
    const polygons: (Polygon | MultiPolygon)[] = [];
    for (const routeFeature of entry.data.features) {
        const buffered = turf.buffer(routeFeature, radiusMeters, { units: 'meters' });
        const geometry = buffered?.geometry as Polygon | MultiPolygon | undefined;
        if (geometry) polygons.push(geometry);
    }
    if (polygons.length === 0) {
        return {
            error: `Failed to compute route corridor for "${entry.id}" (turf.buffer returned no geometry for any of the ${entry.data.features.length} route alternative(s)).`,
        };
    }
    return { polygons, routeLabel: entry.label };
};

const searchByDetour = async (
    state: ToolState,
    detour: MaxDetourWhere,
    query: string | undefined,
    resolvedPoiCategories: POICategory[] | undefined,
    entryId: string | undefined,
): Promise<{ result: Awaited<ReturnType<typeof alongRouteSearch>>; placesEntryId: string } | { error: string }> => {
    const entries = state.routing.entries;
    if (entries.length === 0) {
        return { error: 'No routes in state. Calculate a route first via setRoute.' };
    }
    const routeEntry = detour.routeId ? entries.find((e) => e.id === detour.routeId) : entries.at(-1);
    if (!routeEntry) {
        return { error: `No route found with id "${detour.routeId}". Use recallRoutes to list available routes.` };
    }
    const routeFeature = routeEntry.data.features[0];
    if (!routeFeature) {
        return { error: `Route entry "${routeEntry.id}" has no geometry.` };
    }

    const result = await alongRouteSearch({
        route: routeFeature,
        maxDetourTimeSeconds: detour.maxDetourTimeSeconds,
        ...(query && { query }),
        ...(resolvedPoiCategories && { poiCategories: resolvedPoiCategories }),
        ...(detour.sortBy && { sortBy: detour.sortBy }),
        ...(detour.limit !== undefined && { limit: detour.limit }),
    });
    const placesEntryId = await state.places.addPlaceResult(
        result,
        makePlacesLabel(result, { query, poiCategories: resolvedPoiCategories, routeLabel: routeEntry.label }),
        entryId,
    );
    return { result, placesEntryId };
};

// Some `MultiFilters` keys (`municipalities`, `boundingBoxes`, `placeTypes`, `areaId`,
// `areaTags`) only exist on the experimental exploration-search backend. Strip them when
// calling the default `search`.
const stripExperimentalFilters = (filters: MultiFilters): { geometries?: (Polygon | MultiPolygon)[] } => {
    const { geometries } = filters;
    return geometries?.length ? { geometries } : {};
};

// Single dispatch point for the experimental vs stable search backends. Backends differ in:
// - `limit` cap (10000 for explorationSearch, 100 for search);
// - which MultiFilters keys are accepted (search only consumes `geometries`).
const dispatchPlacesSearch = (
    useExperimental: boolean,
    params: {
        query: string | undefined;
        poiCategories: POICategory[] | undefined;
        bias?: WhereBias;
        radiusMeters?: number;
        multiFilters: MultiFilters;
    },
): Promise<Awaited<ReturnType<typeof explorationSearch>>> => {
    const { query, poiCategories, bias = {}, radiusMeters, multiFilters } = params;
    const common = {
        query,
        poiCategories,
        ...bias,
        ...(radiusMeters !== undefined && { radiusMeters }),
    };
    return useExperimental
        ? explorationSearch({ ...common, limit: 10000, ...multiFilters })
        : search({ ...common, limit: 100, ...stripExperimentalFilters(multiFilters) });
};

const searchInRange = async (
    state: ToolState,
    range: string,
    query: string | undefined,
    resolvedPoiCategories: POICategory[] | undefined,
    multiFilters: MultiFilters,
    entryId: string | undefined,
    routeLabel: string | undefined,
    useExperimental: boolean,
): Promise<{ result: Awaited<ReturnType<typeof explorationSearch>>; placesEntryId: string } | { error: string }> => {
    const rangesEntry = state.ranges.entries.find((e) => e.id === range);
    if (!rangesEntry || rangesEntry.ranges.length === 0) {
        return { error: `Range "${range}" not found. Use recallRanges to list available ranges.` };
    }
    // Combine every range's polygon into the search bias so multi-origin entries
    // search the union of their reachable areas. We keep one geometry per
    // origin's outermost polygon (entries store each origin's full polygon
    // FeatureCollection — feature[0] is the largest budget when multi-budget).
    const rangeGeometries = rangesEntry.ranges
        .map((r) => r.polygon?.features[0]?.geometry)
        .filter((g): g is NonNullable<typeof g> => !!g);
    if (rangeGeometries.length === 0) {
        return { error: `Range "${range}" has no polygons. Recompute via findReachableAreas.` };
    }
    const combinedGeometries = [...rangeGeometries, ...(multiFilters.geometries ?? [])];
    const result = await dispatchPlacesSearch(useExperimental, {
        query,
        poiCategories: resolvedPoiCategories,
        multiFilters: { ...multiFilters, geometries: combinedGeometries },
    });
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
// `viewport` bias path, or the multi-region path (any combo of boundingBoxes / queries / placeIds /
// municipalities / geometries / range / route). The two paths are mutually exclusive at the schema
// level — see the refinement on `buildDiscoverWithinWhereSchema`.
type WithinResolution = {
    bias: WhereBias;
    multiFilters: MultiFilters;
    range?: string;
    routeLabel?: string;
};

// Resolve `where.queries` entries to polygons (preferred) or bboxes. A failure on any single entry
// aborts — better to surface a precise error than to silently search a smaller area.
const resolveQueriesToAreas = async (
    queries: { query: string; queryAs?: QueryAs }[],
    state: ToolState,
): Promise<{ geometries: (Polygon | MultiPolygon)[]; boundingBoxes: HasBBox[] } | { error: string }> => {
    const biasPosition = getViewportBias(state.baseMap);
    const geometries: (Polygon | MultiPolygon)[] = [];
    const boundingBoxes: HasBBox[] = [];
    for (const q of queries) {
        const resolved = await resolveQueryToWithinArea(q.query, q.queryAs ?? 'place', biasPosition);
        if (!resolved) {
            return { error: `Could not resolve "${q.query}". Try a more specific query, a placeId, or a boundingBox.` };
        }
        if (resolved.geometry?.geometry) {
            geometries.push(resolved.geometry.geometry as Polygon | MultiPolygon);
        } else if (resolved.place.bbox) {
            boundingBoxes.push(resolved.place.bbox);
        } else {
            return {
                error:
                    `"${q.query}" resolved to a place with no geometry or bbox — cannot use as a "within" area. ` +
                    'Use mode "nearby" with this query for a point bias instead.',
            };
        }
    }
    return { geometries, boundingBoxes };
};

// Resolve `where.placeIds` entries to their boundary polygons via the Geometry Data service.
const resolvePlaceIdsToGeometries = async (
    placeIds: string[],
    state: ToolState,
): Promise<{ geometries: (Polygon | MultiPolygon)[] } | { error: string }> => {
    const geometries: (Polygon | MultiPolygon)[] = [];
    for (const placeId of placeIds) {
        const lookup = state.places.findPlaceById(placeId);
        if (!lookup) {
            return { error: `Unknown placeId "${placeId}". Use recallPlaces to list available IDs.` };
        }
        if (!lookup.place.properties.dataSources?.geometry?.id) {
            return { error: `Place "${placeId}" has no geometry data source (most addresses and streets lack one).` };
        }
        const feature = await state.places.fetchPlaceGeometry(placeId);
        if (!feature) {
            return { error: `Geometry Data service returned no feature for place "${placeId}".` };
        }
        geometries.push(feature.geometry as Polygon | MultiPolygon);
    }
    return { geometries };
};

const resolveDiscoverWithin = async (
    where: DiscoverWithinWhere,
    state: ToolState,
    baseFilters: MultiFilters,
): Promise<WithinResolution | { error: string }> => {
    if (where.viewport) {
        return {
            bias: { boundingBox: getViewportBoundingBox(state.baseMap) },
            multiFilters: baseFilters,
        };
    }

    const resolvedGeometries: (Polygon | MultiPolygon)[] = [];
    const resolvedBoundingBoxes: HasBBox[] = [];

    if (where.queries?.length) {
        const resolved = await resolveQueriesToAreas(where.queries, state);
        if ('error' in resolved) return resolved;
        resolvedGeometries.push(...resolved.geometries);
        resolvedBoundingBoxes.push(...resolved.boundingBoxes);
    }

    if (where.placeIds?.length) {
        const resolved = await resolvePlaceIdsToGeometries(where.placeIds, state);
        if ('error' in resolved) return resolved;
        resolvedGeometries.push(...resolved.geometries);
    }

    // `boundingBoxes`, `municipalities`, and `areaId` only exist on the experimental schema;
    // treat them as absent on the default schema.
    const experimentalWhere = where as DiscoverWithinWhere & {
        boundingBoxes?: HasBBox[];
        municipalities?: string[];
        areaId?: string;
    };

    const mergedBoundingBoxes: HasBBox[] = [
        ...((experimentalWhere.boundingBoxes ?? []) as unknown as HasBBox[]),
        ...resolvedBoundingBoxes,
    ];
    const mergedGeometries: (Polygon | MultiPolygon)[] = [
        ...((where.geometries ?? []) as (Polygon | MultiPolygon)[]),
        ...resolvedGeometries,
    ];

    const multiFilters: MultiFilters = {
        ...baseFilters,
        ...(experimentalWhere.municipalities?.length && { municipalities: experimentalWhere.municipalities }),
        ...(experimentalWhere.areaId && { areaId: experimentalWhere.areaId }),
        ...(mergedBoundingBoxes.length && { boundingBoxes: mergedBoundingBoxes }),
        ...(mergedGeometries.length && { geometries: mergedGeometries }),
    };

    let routeLabel: string | undefined;
    if (where.route) {
        const resolved = resolveWithinRoute(state, where.route);
        if ('error' in resolved) return resolved;
        multiFilters.geometries = [...(multiFilters.geometries ?? []), ...resolved.polygons];
        routeLabel = resolved.routeLabel;
    }

    return { bias: {}, multiFilters, range: where.range, routeLabel };
};

// Resolves a `nearby` bias to a position (and optional radius cap).
const resolveNearbyBias = async (
    where: NearbyWhere,
    state: ToolState,
): Promise<{ bias: WhereBias; radiusMeters?: number }> => {
    if (where.viewport) {
        const position = getViewportBias(state.baseMap);
        return { bias: position ? { position } : {}, radiusMeters: where.radiusMeters };
    }
    if (where.position) {
        return { bias: { position: where.position as Position }, radiusMeters: where.radiusMeters };
    }
    if (where.query) {
        const viewport = getViewportBias(state.baseMap);
        const place = await locatePlace(
            where.query,
            where.queryAs ?? 'place',
            viewport ? { position: viewport } : undefined,
        );
        if (place) {
            const pos = getPosition(place);
            if (pos) return { bias: { position: pos }, radiusMeters: where.radiusMeters };
        }
        return { bias: {}, radiusMeters: where.radiusMeters };
    }
    return { bias: {}, radiusMeters: where.radiusMeters };
};

type ResolvedDiscoverBias = {
    bias: WhereBias;
    multiFilters: MultiFilters;
    radiusMeters?: number;
    range?: string;
    routeLabel?: string;
};

// Dispatch the `where` mode to its dedicated resolver. `maxDetour` is handled separately by the
// caller (different SDK endpoint); `global` falls through with an empty bias.
const resolveDiscoverBias = async (
    effectiveWhere: DiscoverPlacesWhere,
    state: ToolState,
    baseMultiFilters: MultiFilters,
): Promise<ResolvedDiscoverBias | { error: string }> => {
    if (effectiveWhere.mode === 'nearby') {
        const nearby = await resolveNearbyBias(effectiveWhere, state);
        return { bias: nearby.bias, multiFilters: baseMultiFilters, radiusMeters: nearby.radiusMeters };
    }
    if (effectiveWhere.mode === 'within') {
        const resolved = await resolveDiscoverWithin(effectiveWhere, state, baseMultiFilters);
        if ('error' in resolved) return resolved;
        return {
            bias: resolved.bias,
            multiFilters: resolved.multiFilters,
            range: resolved.range,
            routeLabel: resolved.routeLabel,
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
    state: ToolState,
    query: string | undefined,
    bias: WhereBias,
    resolvedPoiCategories: POICategory[] | undefined,
    radiusMeters: number | undefined,
    multiFilters: MultiFilters,
    entryId: string | undefined,
    where: DiscoverPlacesWhere | undefined,
    routeLabel: string | undefined,
    useExperimental: boolean,
): Promise<{ result: Awaited<ReturnType<typeof explorationSearch>>; placesEntryId: string }> => {
    const result = await dispatchPlacesSearch(useExperimental, {
        query,
        poiCategories: resolvedPoiCategories,
        bias,
        radiusMeters,
        multiFilters,
    });
    const placesEntryId = await state.places.addPlaceResult(
        result,
        makePlacesLabel(result, {
            query,
            poiCategories: resolvedPoiCategories,
            where: resolveWhereLabel(where),
            ...(routeLabel && { routeLabel }),
        }),
        entryId,
    );
    return { result, placesEntryId };
};

// Render-on-map + boundary-geometry post-processing shared by every dispatch branch.
const finalizeDiscoverResult = async (
    state: ToolState,
    result: Awaited<ReturnType<typeof explorationSearch>>,
    placesEntryId: string,
    show: z.infer<ReturnType<typeof buildDiscoverPlacesSchema>>['show'],
    geometries: z.infer<ReturnType<typeof buildDiscoverPlacesSchema>>['geometries'],
    flags: FeatureFlags,
) => {
    const shown = show ? await showResultsOnMap(state, [placesEntryId], show) : undefined;

    let geometriesFetched: number | undefined;
    let geometriesShown: boolean | undefined;
    if (geometries) {
        const geometryResult = await showEntryGeometries(state, placesEntryId, geometries);
        geometriesFetched = geometryResult.fetched;
        if (geometryResult.shown) geometriesShown = true;
    }

    const label = state.places.entries.find((entry) => entry.id === placesEntryId)?.label;

    return {
        ...summarizePlaces(result, flags),
        placesEntryId,
        ...(label && { label }),
        ...(shown && { shown }),
        ...(geometriesFetched !== undefined && { geometriesFetched }),
        ...(geometriesShown !== undefined && { geometriesShown }),
    };
};

/**
 * Build the discoverPlaces executor for a given {@link FeatureFlags} bag. When
 * `experimentalSearch` is on, the underlying search calls dispatch to {@link explorationSearch}
 * (the unstable backend with a richer input surface). Otherwise they go through the stable
 * {@link search} router.
 */
export const buildExecuteDiscoverPlaces = (flags: FeatureFlags) => {
    const useExperimental = flags.experimentalSearch === true;
    return async (
        params: z.infer<ReturnType<typeof buildDiscoverPlacesSchema>>,
        state: ToolState,
    ): Promise<z.infer<typeof discoverPlacesOutputSchema>> => {
        const { query, where, poiCategories, show, entryId, geometries } = params;
        // `placeTypes` and `areaTags` only exist on the experimental schema.
        const experimentalParams = params as {
            placeTypes?: ('POI' | 'PointAddress' | 'Street')[];
            areaTags?: PopulatedAreaTag[];
        };
        const placeTypes = experimentalParams.placeTypes;
        const areaTags = experimentalParams.areaTags;

        // Resolve once upstream — exact catalog codes pass through, natural-language terms are
        // synonym-resolved via getPoiCategoryCodes. We only error when the LLM passed inputs and
        // NONE matched anything, since a no-filter search would silently widen the result set.
        // Note: this trades a hard error for confusable inputs (e.g. "PARKING_LOT" → parking codes
        // when the user meant parks); we accept that and rely on the description hints to steer
        // the LLM toward the right codes up-front.
        const { resolved: resolvedPoiCategories, unresolved } = await resolvePoiCategories(poiCategories);
        if (poiCategories?.length && !resolvedPoiCategories) {
            return {
                error:
                    `No POI categories matched: ${unresolved.map((c) => `"${c}"`).join(', ')}. ` +
                    'POI category codes must be exact CONSTANT_CASE values, or natural-language terms resolvable by the SDK catalog. ' +
                    'Call getPoiCategoryCodes to find valid codes for your search subject (e.g. "italian food", "gym").',
            };
        }

        // Default to viewport-bounded when no `where` was supplied.
        const effectiveWhere: DiscoverPlacesWhere = where ?? { mode: 'within', viewport: true };
        // Top-level filters that compose with any `where` scope (not geo-biases on their own).
        const baseMultiFilters: MultiFilters = {
            ...(placeTypes?.length && { placeTypes }),
            ...(areaTags?.length && { areaTags }),
        };

        try {
            // maxDetour dispatches to a different SDK endpoint and shares no params with the rest.
            if (effectiveWhere.mode === 'maxDetour') {
                const detourResult = await searchByDetour(state, effectiveWhere, query, resolvedPoiCategories, entryId);
                if ('error' in detourResult) return detourResult;
                return finalizeDiscoverResult(
                    state,
                    detourResult.result,
                    detourResult.placesEntryId,
                    show,
                    geometries,
                    flags,
                );
            }

            const resolved = await resolveDiscoverBias(effectiveWhere, state, baseMultiFilters);
            if ('error' in resolved) return resolved;
            const { bias, multiFilters, radiusMeters, range, routeLabel } = resolved;

            if (range) {
                const rangeResult = await searchInRange(
                    state,
                    range,
                    query,
                    resolvedPoiCategories,
                    multiFilters,
                    entryId,
                    routeLabel,
                    useExperimental,
                );
                if ('error' in rangeResult) return rangeResult;
                return finalizeDiscoverResult(
                    state,
                    rangeResult.result,
                    rangeResult.placesEntryId,
                    show,
                    geometries,
                    flags,
                );
            }

            const biasResult = await searchWithBias(
                state,
                query,
                bias,
                resolvedPoiCategories,
                radiusMeters,
                multiFilters,
                entryId,
                effectiveWhere,
                routeLabel,
                useExperimental,
            );
            return finalizeDiscoverResult(state, biasResult.result, biasResult.placesEntryId, show, geometries, flags);
        } catch (error) {
            return { error: `Search failed: ${error instanceof Error ? error.message : String(error)}` };
        }
    };
};

/** Default-flag (`experimentalSearch: false`) executor for the discover-places tool. */
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
        'Within-mode: route → corridor. Prefer geometries/municipalities/placeIds over bbox. ' +
        'Skip for already-stored places — use recallPlaces/processData.',
    tags: ['discover', 'place', 'location'],
    examples: [
        'discoverPlaces({ poiCategories: ["RESTAURANT", "CAFE", "BAR"], entryId: "amsterdam-food-spots" })  // batch many categories + semantic id',
        'discoverPlaces({ query: "coffee", where: { mode: "nearby", position: [4.9, 52.4], radiusMeters: 500 } })',
        'discoverPlaces({ query: "parking", where: { mode: "within", queries: [{ query: "De Jordaan, Amsterdam", queryAs: "place" }] } })  // area name goes in `where.queries`, NOT top-level `query`',
        'discoverPlaces({ query: "coffee", where: { mode: "nearby", query: "Schiphol Airport", queryAs: "poi", radiusMeters: 2000 } })  // POI-resolved bias point',
        'discoverPlaces({ poiCategories: ["HOTEL"], where: { mode: "within", municipalities: ["Amsterdam", "Utrecht"] }, entryId: "ams-utrecht-hotels" })',
        'discoverPlaces({ query: "bakery", where: { mode: "within", range: "ranges-0" } })',
        'discoverPlaces({ poiCategories: ["CAFE"], show: { markerType: "pin", zoomMode: "auto" } })  // omit `where` → defaults to viewport',
        'discoverPlaces({ poiCategories: ["RESTAURANT"], where: { mode: "within", queries: [{ query: "Paris" }] } })  // "restaurants in Paris" — subject in `poiCategories`, area in `where.queries`',
        'discoverPlaces({ poiCategories: ["ELECTRIC_VEHICLE_STATION"], where: { mode: "within", route: { routeId: "routes-0", widthMeters: 1000 } } })  // bulk corridor scan along the route',
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
        'Show the boundaries of these municipalities',
        'Find all EV stations within 1 km of my route',
        'Cafes in a 500 m corridor around the planned route',
        'Best 5 coffee stops without losing more than 5 min off my route',
        'EV chargers I can reach with under 10 min detour',
    ],
    relatedTools: [
        'getPOICategoryCodes',
        'updatePlacesDisplay',
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
