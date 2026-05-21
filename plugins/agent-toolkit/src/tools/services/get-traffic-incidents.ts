/**
 * @module agent-toolkit-tools
 */

import { type BBox, bboxFromGeoJSON, trafficIncidentRequestCategories } from '@tomtom-org/maps-sdk/core';
import { type TrafficIncidentDetailsByBBoxParams, trafficIncidentDetails } from '@tomtom-org/maps-sdk/services';

import * as turf from '@turf/turf';
import type { MultiPolygon, Polygon } from 'geojson';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { geoJsonBBoxSchema, geometryInputSchema, getViewportBias, queryAsSchema, withinSharedFields } from '../shared';
import { toolErrorSchema } from '../shared-output-schemas';
import { locatePlaces, type QueryAs } from './locate-place';

// Number of candidate places to consider when resolving `where.queries` — a precise area often
// lives a few results down the list (e.g. a street POI may rank above the neighbourhood it sits in).
const QUERY_CANDIDATE_LIMIT = 5;

// Compact list of every entry currently held by `state.trafficIncidents`. Returned alongside
// the freshly-fetched data so the LLM sees what's available without a separate recall call.
const entriesSummary = (state: ToolState) =>
    state.trafficIncidents.entries.map((e) => ({
        id: e.id,
        label: e.label,
        count: e.data.length,
        timestamp: e.timestamp,
    }));

/**
 * Output schema for the get-traffic-incidents tool.
 *
 * By design this tool is a **loader**, not an aggregator. It fetches incidents into a new
 * (or already-loaded) entry, renders them on the map, and returns
 * `{ count, entryId, entries }` — `entries` is a compact summary of every entry currently
 * cached in `state.trafficIncidents`, so the agent can pick a follow-up target without a
 * separate recall call.
 *
 * Every aggregation (counts by category, severity, time-validity, top roads, top-N,
 * clustering, corridor group-by, proximity, spatial joins) is the job of `analyseData`
 * (counts / charts / deltas — attaches to the source entry's `_analyses`) and `focusIncidents`
 * (highlight/filter a subset on an existing entry). Both inject the entry's full feature
 * set into the sandbox.
 *
 * Background polling is opt-in via the separate `startTrafficIncidentsMonitor` tool — keeps
 * the loader a single, predictable network call.
 *
 * Historic shortcuts like a built-in summary, `topIncidents`, and `includeIncidents` were
 * removed: they let the agent skip real aggregation and misrepresent individual top-delay
 * incidents as "clusters" or "hotspots". The contract now forces the agent through
 * analyseData/focusIncidents for anything beyond `count`.
 */
export const getTrafficIncidentsOutputSchema = z.union([
    z.object({
        count: z.number(),
        entryId: z.string().optional(),
        entries: z.array(
            z.object({
                id: z.string(),
                label: z.string(),
                count: z.number(),
                timestamp: z.number(),
            }),
        ),
    }),
    toolErrorSchema,
]);

// `within` mode for getTrafficIncidents — single-area scope. Either `viewport` alone or any
// combination of the multi-region fields (boundingBox / queries / placeIds / geometries / range /
// route). Each multi-region input is resolved to a bbox and the union of bboxes is sent to the
// SDK (which only accepts a single bbox of at most 10,000 km²).
const withinTrafficIncidentsWhereSchema = z
    .object({
        ...withinSharedFields,
        boundingBox: geoJsonBBoxSchema
            .optional()
            .describe('Single bbox [W,S,E,N]. EXCLUSIVE with viewport; composes with other multi-region fields.'),
        queries: z
            .array(
                z.object({
                    query: z
                        .string()
                        .describe(
                            'Name of a CONTAINING area (e.g. "Paris", "De Jordaan, Amsterdam", "M25"). ' +
                                'Resolved to its bbox (or polygon bbox) and merged into the search area.',
                        ),
                    queryAs: queryAsSchema,
                }),
            )
            .optional()
            .describe(
                'CONTAINING areas to fetch incidents within. Each entry geocodes to a bbox; the union of all ' +
                    'bboxes is used. Pair per-item `queryAs` to disambiguate POI vs place. ' +
                    'EXCLUSIVE with viewport; composes with other multi-region fields.',
            ),
        placeIds: z
            .array(z.string())
            .optional()
            .describe(
                'IDs of session places — each polygon (fetched on demand) contributes its bbox to the area. ' +
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
                    'EXCLUSIVE with viewport; composes with other multi-region fields.',
            ),
    })
    .refine((data) => hasViewportFlag(data) || hasAnyMeaningfulMultiRegion(data), {
        message:
            '`within` requires `viewport: true` OR one or more multi-region fields ' +
            '(boundingBox / queries / placeIds / geometries / range / route) with a meaningful value.',
    });

// --- "Meaningful value" predicates ---------------------------------------------------------------
// Strict-mode LLM providers (Azure / OpenAI strict tool params) fill every optional field of an
// object with empty defaults — `boundingBox: [0,0,0,0]`, `range: ""`, `queries: []`,
// `route: { routeId: "", widthMeters: 0 }` — even when the agent's real intent is a single field.
// These predicates treat such defaulted-but-empty values as omitted, so both the schema refinement
// and the executor agree on which fields actually carry intent.
const bboxIsMeaningful = (b: number[] | undefined): boolean => !!b && b.length === 4 && b.some((v) => v !== 0);
const routeIsMeaningful = (r: { routeId?: string; widthMeters: number } | undefined): boolean =>
    !!r && r.widthMeters > 0 && (r.routeId === undefined || r.routeId.length > 0);
const rangeIsMeaningful = (s: string | undefined): boolean => !!s && s.length > 0;
const hasViewportFlag = (data: { viewport?: true }): boolean => data.viewport === true;
const hasAnyMeaningfulMultiRegion = (data: {
    boundingBox?: number[];
    queries?: unknown[];
    placeIds?: unknown[];
    geometries?: unknown[];
    range?: string;
    route?: { routeId?: string; widthMeters: number };
}): boolean =>
    bboxIsMeaningful(data.boundingBox) ||
    !!data.queries?.length ||
    !!data.placeIds?.length ||
    !!data.geometries?.length ||
    rangeIsMeaningful(data.range) ||
    routeIsMeaningful(data.route);

const trafficIncidentsWhereSchema = z
    .union([withinTrafficIncidentsWhereSchema])
    .describe(
        'Geographic scope. Only `within` mode (single area, defaults to `{ mode: "within", viewport: true }`). ' +
            'Use `viewport` alone for "the network / right now / this area", or any combination of ' +
            'boundingBox / queries / placeIds / geometries / range / route — each resolves to a bbox and ' +
            'the union is sent to the SDK (≤10,000 km²).',
    );

/**
 * Tool schema for fetching traffic incident details.
 */
export const getTrafficIncidentsSchema = z.object({
    where: trafficIncidentsWhereSchema
        .optional()
        .describe('Geographic scope. Default: `{ mode: "within", viewport: true }`.'),
    categoryFilter: z
        .array(z.enum([...trafficIncidentRequestCategories]))
        .optional()
        .describe('Filter by incident category. If omitted, all categories are returned.'),
    timeValidityFilter: z
        .array(z.enum(['present', 'future']))
        .optional()
        .describe("default: ['present']"),
    label: z
        .string()
        .optional()
        .describe(
            'Short human-readable label for this fetch — name the place ("Central London", ' +
                '"Amsterdam ring", "M25 corridor"), not coordinates. Surfaced verbatim in the ' +
                'monitor chip and on the entry chip in the UI; also used by analyseData / ' +
                'focusIncidents to disambiguate which entry to operate on. Always pass one when ' +
                'silent is false; the bbox-coordinate fallback ("bbox a,b → c,d") is for silent ' +
                'intermediate fetches only.',
        ),
    silent: z
        .boolean()
        .optional()
        .describe(
            'Default: false. When true, suppress map rendering (use for intermediate calculations only). ' +
                'Normally, fetched incidents auto-render on the map so the user can visually validate the agent is looking at the right area.',
        ),
    fitBounds: z.boolean().optional().describe('Default: true. Pass false to skip camera move after rendering.'),
});

export const getTrafficIncidentsDescription =
    'LOADER. Fetches traffic incidents (present or future) into a cached entry, renders them on the map, returns ' +
    '`{ count, entryId, entries }` (`entries` lists every cached entry so the agent can pick a follow-up target). ' +
    'No per-incident details, no aggregation — those belong to analyseData/focusIncidents. ' +
    '\n\n' +
    'AREA via `where` (within mode only). Omit `where` to use the current map viewport ' +
    '("the network / right now / this area / here"). For named areas use `where.queries`; ' +
    'for stored places use `where.placeIds`; for an isochrone use `where.range`; for a corridor ' +
    'along a route use `where.route`; for raw bounds use `where.boundingBox`; for custom shapes ' +
    'use `where.geometries`. Multi-region fields compose into one union bbox (≤10,000 km²). ' +
    '\n\n' +
    'CALL ONCE PER AREA. Each call writes a new entry; re-calling burns steps. Pick the right follow-up instead: ' +
    'analyseData (counts, top-N, charts, clusters, trend via `previous`); focusIncidents (highlight a subset); ' +
    'startTrafficIncidentsMonitor (keep the entry fresh in the background). ' +
    '\n\n' +
    '`silent: true` suppresses rendering (intermediate calcs only); `label` names the snapshot in the UI.';

type WithinWhere = z.infer<typeof withinTrafficIncidentsWhereSchema>;

// Union of BBox tuples → single BBox tuple. Returns undefined when given no inputs.
const unionBBoxes = (parts: BBox[]): BBox | undefined => {
    if (parts.length === 0) return undefined;
    let minLng = Number.POSITIVE_INFINITY;
    let minLat = Number.POSITIVE_INFINITY;
    let maxLng = Number.NEGATIVE_INFINITY;
    let maxLat = Number.NEGATIVE_INFINITY;
    for (const [a, b, c, d] of parts) {
        if (a < minLng) minLng = a;
        if (b < minLat) minLat = b;
        if (c > maxLng) maxLng = c;
        if (d > maxLat) maxLat = d;
    }
    return [minLng, minLat, maxLng, maxLat];
};

// Resolves `where.queries` to a list of bboxes. Each query geocodes (POI or place per `queryAs`)
// with the current viewport as bias. A query failing to resolve aborts the whole call — better to
// surface a precise error than to silently search a smaller area.
const resolveQueriesToBBoxes = async (
    queries: { query: string; queryAs?: QueryAs }[],
    state: ToolState,
): Promise<{ bboxes: BBox[] } | { error: string }> => {
    const biasPosition = getViewportBias(state.baseMap);
    const bboxes: BBox[] = [];
    for (const q of queries) {
        const candidates = await locatePlaces(q.query, q.queryAs ?? 'place', {
            limit: QUERY_CANDIDATE_LIMIT,
            bias: biasPosition ? { position: biasPosition } : undefined,
        });
        if (candidates.length === 0) {
            return { error: `Could not resolve "${q.query}". Try a more specific query, a placeId, or a boundingBox.` };
        }
        const bbox = bboxFromGeoJSON(candidates[0]) as BBox | undefined;
        if (!bbox) {
            return {
                error:
                    `"${q.query}" resolved to a place with no bbox — cannot use as a "within" area. ` +
                    'Provide a boundingBox or a different query.',
            };
        }
        bboxes.push(bbox);
    }
    return { bboxes };
};

// Resolves `where.placeIds` to a list of bboxes. Prefers a cached `place.bbox`; falls back to
// fetching the boundary polygon via Geometry Data when the place has no bbox of its own.
const resolvePlaceIdsToBBoxes = async (
    placeIds: string[],
    state: ToolState,
): Promise<{ bboxes: BBox[] } | { error: string }> => {
    const bboxes: BBox[] = [];
    for (const placeId of placeIds) {
        const lookup = state.places.findPlaceById(placeId);
        if (!lookup) {
            return { error: `Unknown placeId "${placeId}". Use recallPlaces to list available IDs.` };
        }
        const directBBox = bboxFromGeoJSON(lookup.place) as BBox | undefined;
        if (directBBox) {
            bboxes.push(directBBox);
            continue;
        }
        const feature = await state.places.fetchPlaceGeometry(placeId);
        const fetched = feature ? (bboxFromGeoJSON(feature) as BBox | undefined) : undefined;
        if (!fetched) {
            return {
                error:
                    `Place "${placeId}" has no bbox or fetchable boundary polygon. ` +
                    'Provide a boundingBox or a different placeId.',
            };
        }
        bboxes.push(fetched);
    }
    return { bboxes };
};

// Resolves `where.range` to a list of bboxes (one per origin polygon). Multi-origin entries
// combine their reachable polygons into the union area.
const resolveRangeToBBoxes = (state: ToolState, rangeId: string): { bboxes: BBox[] } | { error: string } => {
    const rangesEntry = state.ranges.entries.find((e) => e.id === rangeId);
    if (!rangesEntry || rangesEntry.ranges.length === 0) {
        return { error: `Range "${rangeId}" not found. Use recallRanges to list available ranges.` };
    }
    const bboxes: BBox[] = [];
    for (const r of rangesEntry.ranges) {
        const polygon = r.polygon?.features[0];
        const bbox = polygon ? (bboxFromGeoJSON(polygon) as BBox | undefined) : undefined;
        if (bbox) bboxes.push(bbox);
    }
    if (bboxes.length === 0) {
        return { error: `Range "${rangeId}" has no polygons. Recompute via findReachableAreas.` };
    }
    return { bboxes };
};

// Resolves `where.route` to a list of bboxes — one per route alternative — for the buffered
// corridor at `widthMeters/2` either side of each route line. `widthMeters` is the *total*
// corridor width, mirroring discover-places' `within.route` semantics.
const resolveRouteToBBoxes = (
    state: ToolState,
    route: { routeId?: string; widthMeters: number },
): { bboxes: BBox[]; routeLabel: string } | { error: string } => {
    const entries = state.routing.entries;
    if (entries.length === 0) {
        return { error: 'No routes in state. Calculate a route first via setRoute.' };
    }
    const entry = route.routeId ? entries.find((e) => e.id === route.routeId) : entries.at(-1);
    if (!entry) {
        return { error: `No route found with id "${route.routeId}". Use recallRoutes to list available routes.` };
    }
    if (entry.data.features.length === 0) {
        return { error: `Route entry "${entry.id}" has no geometry.` };
    }
    const radiusMeters = route.widthMeters / 2;
    const bboxes: BBox[] = [];
    for (const routeFeature of entry.data.features) {
        const buffered = turf.buffer(routeFeature, radiusMeters, { units: 'meters' });
        const bbox = buffered ? (bboxFromGeoJSON(buffered) as BBox | undefined) : undefined;
        if (bbox) bboxes.push(bbox);
    }
    if (bboxes.length === 0) {
        return {
            error: `Failed to compute route corridor for "${entry.id}" (turf.buffer returned no geometry for any of the ${entry.data.features.length} route alternative(s)).`,
        };
    }
    return { bboxes, routeLabel: entry.label };
};

type ResolvedScope = { bbox: BBox; routeLabel?: string };

// Viewport branch — isolated so the try/catch noise doesn't inflate the main resolver.
const resolveViewportToBBox = (state: ToolState): ResolvedScope | { error: string } => {
    try {
        return { bbox: state.baseMap.ttMap.getBBox() };
    } catch (error) {
        return { error: `Viewport fallback failed: ${error instanceof Error ? error.message : String(error)}` };
    }
};

// Cheap inline pass — converts `where.geometries` polygons into bboxes.
const bboxesFromGeometries = (geometries: WithinWhere['geometries']): BBox[] => {
    if (!geometries?.length) return [];
    const out: BBox[] = [];
    for (const g of geometries as (Polygon | MultiPolygon)[]) {
        const bbox = bboxFromGeoJSON(g) as BBox | undefined;
        if (bbox) out.push(bbox);
    }
    return out;
};

// Drains the multi-region branches in sequence, skipping fields with non-meaningful (strict-mode
// LLM-defaulted) values. Any sub-resolver short-circuit (error) aborts the whole pass — better to
// surface a precise error than to silently search a smaller area.
const collectMultiRegionBBoxes = async (
    where: WithinWhere,
    state: ToolState,
): Promise<{ bboxes: BBox[]; routeLabel?: string } | { error: string }> => {
    const collected: BBox[] = [];
    let routeLabel: string | undefined;

    if (bboxIsMeaningful(where.boundingBox)) collected.push(where.boundingBox as BBox);

    if (where.queries?.length) {
        const resolved = await resolveQueriesToBBoxes(where.queries, state);
        if ('error' in resolved) return resolved;
        collected.push(...resolved.bboxes);
    }

    if (where.placeIds?.length) {
        const resolved = await resolvePlaceIdsToBBoxes(where.placeIds, state);
        if ('error' in resolved) return resolved;
        collected.push(...resolved.bboxes);
    }

    collected.push(...bboxesFromGeometries(where.geometries));

    if (rangeIsMeaningful(where.range)) {
        const resolved = resolveRangeToBBoxes(state, where.range as string);
        if ('error' in resolved) return resolved;
        collected.push(...resolved.bboxes);
    }

    if (routeIsMeaningful(where.route)) {
        const resolved = resolveRouteToBBoxes(state, where.route as { routeId?: string; widthMeters: number });
        if ('error' in resolved) return resolved;
        collected.push(...resolved.bboxes);
        routeLabel = resolved.routeLabel;
    }

    return { bboxes: collected, ...(routeLabel && { routeLabel }) };
};

// Resolve a `within` where to a single union bbox. Returns the union along with any incidental
// labels (e.g. the route entry's label) that feed into the auto-generated entry label.
//
// Priority: when any multi-region field carries a meaningful value (e.g. `queries`, `boundingBox`,
// `route`), take the multi-region path even if `viewport: true` is also set. Strict-mode LLM
// providers fill every optional field with empty defaults, so `viewport: true` is frequently
// present alongside the agent's real intent — preferring the more specific signal avoids silently
// answering with the wrong area (e.g. London viewport when the agent asked about Paris).
const resolveWithinToBBox = async (
    where: WithinWhere,
    state: ToolState,
): Promise<ResolvedScope | { error: string }> => {
    if (hasAnyMeaningfulMultiRegion(where)) {
        const collected = await collectMultiRegionBBoxes(where, state);
        if ('error' in collected) return collected;
        const merged = unionBBoxes(collected.bboxes);
        if (!merged) {
            return { error: 'No area could be resolved from `where` — provide at least one within field.' };
        }
        return { bbox: merged, ...(collected.routeLabel && { routeLabel: collected.routeLabel }) };
    }
    if (hasViewportFlag(where)) return resolveViewportToBBox(state);
    return { error: 'No area could be resolved from `where` — provide at least one within field.' };
};

// Build a human-readable label from `where` when the caller didn't pass one. Falls back to a
// bbox-coordinate string for silent intermediate fetches.
const defaultLabel = (
    params: TrafficIncidentDetailsByBBoxParams & { bbox: BBox },
    where: WithinWhere | undefined,
    routeLabel: string | undefined,
): string => {
    const filterParts: string[] = [];
    if (params.categoryFilter?.length) filterParts.push(`filtered: ${params.categoryFilter.join(',')}`);
    if (params.timeValidityFilter?.length) filterParts.push(`when: ${params.timeValidityFilter.join(',')}`);

    let head: string | undefined;
    if (where && !where.viewport) {
        if (where.queries?.length) head = where.queries.map((q) => q.query).join(', ');
        else if (routeLabel) head = `along ${routeLabel}`;
        else if (where.range) head = where.range;
    }

    if (!head) {
        const [minLng, minLat, maxLng, maxLat] = params.bbox;
        head = `bbox ${minLng.toFixed(2)},${minLat.toFixed(2)} → ${maxLng.toFixed(2)},${maxLat.toFixed(2)}`;
    }

    return filterParts.length ? `${head} — ${filterParts.join('; ')}` : head;
};

/** Standalone execute for ToolEntry format. */
export const executeGetTrafficIncidents = async (
    params: z.infer<typeof getTrafficIncidentsSchema>,
    state: ToolState,
): Promise<z.infer<typeof getTrafficIncidentsOutputSchema>> => {
    const { where, categoryFilter, timeValidityFilter, label, silent = false, fitBounds = true } = params;

    // Default to viewport when `where` is omitted — keeps the "no scope = current viewport"
    // contract the system prompt promises.
    const effectiveWhere: WithinWhere = where ?? { mode: 'within', viewport: true };

    const resolved = await resolveWithinToBBox(effectiveWhere, state);
    if ('error' in resolved) return resolved;
    const { bbox: effectiveBbox, routeLabel } = resolved;

    const filters = {
        ...(categoryFilter && { categoryFilter }),
        ...(timeValidityFilter && { timeValidityFilter }),
    };

    try {
        const result = await trafficIncidentDetails({ ...filters, bbox: effectiveBbox });

        if (!result.features.length) {
            return { count: 0, entries: entriesSummary(state) };
        }

        const entryParams: TrafficIncidentDetailsByBBoxParams & { bbox: BBox } = {
            bbox: effectiveBbox,
            ...filters,
        };
        const entryId = await state.trafficIncidents.addIncidentsEntry(
            result.features,
            entryParams,
            label ?? defaultLabel(entryParams, effectiveWhere, routeLabel),
            Date.now(),
        );

        if (!silent) {
            await state.trafficIncidents.showEntry(entryId, fitBounds);
        }

        return {
            count: result.features.length,
            entryId,
            entries: entriesSummary(state),
        };
    } catch (error) {
        return {
            error: `Failed to get traffic incidents: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
