/**
 * @module agent-toolkit-tools
 */

import { type BBox, bboxFromGeoJSON, trafficIncidentRequestCategories } from '@tomtom-org/maps-sdk/core';
import { type TrafficIncidentDetailsByBBoxParams, trafficIncidentDetails } from '@tomtom-org/maps-sdk/services';

import { z } from 'zod';
import type { ToolState } from '../../types';
import {
    type AreaWhere,
    geoJsonBBoxSchema,
    getRangePolygons,
    isResolveError,
    matchedAreasLabel,
    type ResolvedAreaDisclosure,
    resolvedAreasDisclosure,
    resolveWithinAreas,
    sharedWithinFields,
    unionBBox,
} from '../shared';
import { toolStateToWhereContext } from '../shared/tool-state-where-context';
import { resolvedAreasOutputSchema, toolErrorSchema } from '../shared-output-schemas';

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
 * (counts / charts / deltas — results stored in the session `state.analyses` store) and `focusIncidents`
 * (highlight/filter a subset on an existing entry). Both inject the entry's full feature
 * set into the sandbox.
 *
 * Background polling rides along by default (`monitor: true`) — a shown fetch arms a monitor on the
 * new entry, but with `skipInitialTick` so the loader stays a single network call. Pass
 * `monitor: false` for a one-shot snapshot; `setTrafficIncidentsMonitor` remains for arming a
 * monitor on an entry loaded on an earlier turn.
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
        resolvedAreas: resolvedAreasOutputSchema.optional(),
        entries: z.array(
            z.object({
                id: z.string(),
                label: z.string(),
                count: z.number(),
                timestamp: z.number(),
            }),
        ),
        monitoring: z
            .boolean()
            .optional()
            .describe('True when this fetch also armed a background monitor on the new entry.'),
    }),
    toolErrorSchema,
]);

// `within` mode for getTrafficIncidents — the shared multi-region block + traffic's singular
// `boundingBox`. Accepts `viewport` alone, one+ multi-region field, OR both: when both are present
// the executor's resolveAreas prefers the explicit multi-region scope over the ambient viewport.
const withinTrafficIncidentsWhereSchema = z
    .object({
        ...sharedWithinFields,
        boundingBox: geoJsonBBoxSchema
            .optional()
            .describe(
                'Single bbox [W,S,E,N]. Composes with other multi-region fields (union); ' +
                    'may also be combined with viewport, in which case these explicit bounds take precedence over it.',
            ),
    })
    .refine(
        (data) =>
            data.viewport === true ||
            data.boundingBox !== undefined ||
            data.queries !== undefined ||
            data.placeIds !== undefined ||
            data.geometries !== undefined ||
            data.range !== undefined ||
            data.route !== undefined,
        {
            message:
                '`within` requires `viewport: true` OR one or more multi-region fields ' +
                '(boundingBox / queries / placeIds / geometries / range / route).',
        },
    );

const trafficIncidentsWhereSchema = z
    .union([withinTrafficIncidentsWhereSchema])
    .describe(
        'Geographic scope. Only `within` mode (single area, defaults to `{ mode: "within", viewport: true }`). ' +
            'Use `viewport` alone for "the network / right now / this area", or any combination of ' +
            'boundingBox / queries / placeIds / geometries / range / route — each resolves to a bbox and ' +
            'the union is sent to the SDK (≤10,000 km²).',
    );

// The canonical category values listed inline so the agent maps the user's wording to the closest
// one (e.g. "roadblock" → `road-closed`) instead of giving up when their term isn't a literal enum.
// Built from `trafficIncidentRequestCategories` — single source of truth, can't drift.
const categoryFilterDescription = `Filter by incident category (server-side). Canonical values: ${trafficIncidentRequestCategories.join(
    ', ',
)}. Map the user's wording to the closest value. If omitted, all categories are returned.`;

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
        .describe(categoryFilterDescription),
    timeValidityFilter: z
        .array(z.enum(['present', 'future']))
        .optional()
        .describe(
            "Which incidents to fetch by time-validity. Default ['present'] — incidents active RIGHT NOW. " +
                "Only pass 'future' when the user EXPLICITLY asks about upcoming, " +
                'planned, or future incidents.',
        ),
    label: z
        .string()
        .optional()
        .describe(
            'Short human-readable label for this fetch — name the place ("Central London", ' +
                '"Amsterdam ring", "M25 corridor"), not coordinates. Surfaced verbatim in the ' +
                'monitor chip and on the entry chip in the UI; also used by analyseData / ' +
                'focusIncidents to disambiguate which entry to operate on. Always pass one when ' +
                'show is true (the default); the bbox-coordinate fallback ("bbox a,b → c,d") is for ' +
                'hidden (show: false) intermediate fetches only.',
        ),
    show: z
        .boolean()
        .optional()
        .describe(
            'Default: true — incidents auto-render so the user can confirm the agent is looking at the right area. ' +
                'Set false ONLY for an extra throwaway load the user should not see — e.g. a second area fetched ' +
                'purely to compare counts. It is NOT needed to run clusterIncidents or analyseData: those read the ' +
                'entry you already loaded, so never re-fetch an area (shown or not) just to analyse it.',
        ),
    fitBounds: z.boolean().optional().describe('Default: true. Pass false to skip camera move after rendering.'),
    monitor: z
        .boolean()
        .optional()
        .describe(
            'Keep this entry live: poll its area in the background and re-run any registered analyses on each ' +
                'tick. Defaults to true for a shown fetch — live incidents go stale otherwise. Pass false for a ' +
                'one-shot snapshot (e.g. "how many incidents right now?"). Ignored when `show` is false (a hidden ' +
                'throwaway load is never monitored).',
        ),
    monitorIntervalMs: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('Polling interval in ms when monitoring. Default 60000 (60s).'),
});

export const getTrafficIncidentsDescription =
    'LOADER. Fetches present/future traffic incidents into a cached entry, renders them, and returns ' +
    '`{ count, entryId, entries }` (`entries` lists every cached entry as a follow-up target). No per-incident ' +
    'detail or aggregation — those belong to analyseData/focusIncidents. ' +
    '\n\n' +
    'AREA via `where` (within mode only): omit `where` → current viewport; named area → `where.queries`; stored ' +
    'places → `where.placeIds` (a places ENTRY id like "places-0" or locatePlace\'s `placesEntryId`, or a single ' +
    'place id); isochrone → `where.range`; route corridor → `where.route`; raw bounds → ' +
    '`where.boundingBox`; custom shapes → `where.geometries`. Fields union into one bbox (≤10,000 km²). ' +
    '\n\n' +
    'CALL ONCE PER AREA — each call writes a new entry, so re-calling burns steps; pick a follow-up instead: ' +
    'analyseData (counts, top-N, charts, clusters, trend via `previous`) or focusIncidents (highlight a subset). ' +
    '\n\n' +
    'STAYS LIVE BY DEFAULT: a shown fetch arms a background monitor (`monitor: true`) that keeps the entry current ' +
    'and re-runs registered analyses each tick — no separate setTrafficIncidentsMonitor call needed (that is only ' +
    'for an entry loaded on an EARLIER turn). Pass `monitor: false` for a one-shot snapshot. `show: false` ' +
    'suppresses rendering (throwaway loads only; never monitored); `label` names the snapshot in the UI. ' +
    '\n\n' +
    'CHECK WHERE IT RESOLVED: the result `resolvedAreas` reports the GROUNDED place each named query matched ' +
    '(e.g. "east London" → "London, CA"). If it resolved wrong, re-issue with a more specific query (append a region/country).';

type WithinWhere = z.infer<typeof withinTrafficIncidentsWhereSchema>;

type ResolvedScope = { bbox: BBox; routeLabel?: string; resolvedAreas?: ResolvedAreaDisclosure[] };

// Resolves `where.range` to a list of bboxes (one per origin polygon). Multi-origin entries
// combine their reachable polygons into the union area. `range` stays caller-side because it maps
// to stored isochrone polygons, not a geocoded area — the downstream endpoint differs.
const resolveRangeToBBoxes = (state: ToolState, rangeId: string): { bboxes: BBox[] } | { error: string } => {
    const ranged = getRangePolygons(state, rangeId);
    if ('error' in ranged) return ranged;
    const bboxes = ranged.polygons.map((polygon) => bboxFromGeoJSON(polygon)).filter((bbox): bbox is BBox => !!bbox);
    return { bboxes };
};

// Resolve a `within` where to a single union bbox. `range` is resolved separately (it maps to
// stored isochrone polygons, not a geocoded area). All other area branches delegate to the shared
// resolveAreas, which fixes the zero-area-bbox bug on street-only geocode results.
const resolveWithinToBBox = async (
    where: WithinWhere,
    state: ToolState,
): Promise<ResolvedScope | { error: string }> => {
    const bboxes: BBox[] = [];

    // `range` is resolved caller-side (stored isochrones, not a geocoded area) and unioned IN with
    // any other multi-region fields — the schema promises range "composes with" them.
    if (where.range !== undefined) {
        const ranged = resolveRangeToBBoxes(state, where.range);
        if ('error' in ranged) return ranged;
        bboxes.push(...ranged.bboxes);
    }

    // resolveWithinAreas applies the "any area input?" guard itself, so a range-only `where` yields
    // an empty result rather than tripping resolveAreas' "No area specified" guard. Traffic consumes
    // only bboxes — resolve queries to the top candidate's bbox without fetching boundary polygons
    // (it doesn't support polygon filters yet).
    const areaWhere: AreaWhere = {
        viewport: where.viewport,
        boundingBox: where.boundingBox,
        queries: where.queries,
        placeIds: where.placeIds,
        geometries: where.geometries,
        route: where.route,
    };
    const within = await resolveWithinAreas(areaWhere, toolStateToWhereContext(state), { bboxOnlyQueries: true });
    if (isResolveError(within)) return within;
    bboxes.push(...within.areas.map((a) => a.bbox));

    // Surface where each named query actually resolved — the grounded match, independent of the
    // model's own `label`, so the agent can confirm the place (and correct a wrong same-name
    // resolution) rather than silently trust it.
    const resolvedAreas = resolvedAreasDisclosure(within.areas);

    if (bboxes.length === 0) return { error: 'No area resolved from `where`.' };
    return {
        bbox: unionBBox(bboxes),
        routeLabel: within.routeLabel,
        ...(resolvedAreas.length > 0 && { resolvedAreas }),
    };
};

// Build a human-readable label from `where` when the caller didn't pass one. Head preference:
// truthful resolved names (the grounded geocoded match) → route label / range id → bbox-coordinate
// string (the last for hidden show:false intermediate fetches).
const defaultLabel = (
    params: TrafficIncidentDetailsByBBoxParams & { bbox: BBox },
    where: WithinWhere | undefined,
    routeLabel: string | undefined,
    resolvedAreas: ResolvedAreaDisclosure[] | undefined,
): string => {
    const filterParts: string[] = [];
    if (params.categoryFilter?.length) filterParts.push(`filtered: ${params.categoryFilter.join(',')}`);
    if (params.timeValidityFilter?.length) filterParts.push(`when: ${params.timeValidityFilter.join(',')}`);

    // Prefer the grounded match ("London, CA") over the query echo ("east London") so the entry chip
    // never masks a wrong same-name resolution.
    let head: string | undefined = matchedAreasLabel(resolvedAreas);
    if (head === undefined && where && !where.viewport) {
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
    const {
        where,
        categoryFilter,
        timeValidityFilter,
        label,
        show = true,
        fitBounds = true,
        monitor,
        monitorIntervalMs,
    } = params;

    // Default to viewport when `where` is omitted — keeps the "no scope = current viewport"
    // contract the system prompt promises.
    const effectiveWhere: WithinWhere = where ?? { mode: 'within', viewport: true };

    const filters = {
        ...(categoryFilter && { categoryFilter }),
        ...(timeValidityFilter && { timeValidityFilter }),
    };

    try {
        const resolved = await resolveWithinToBBox(effectiveWhere, state);
        if ('error' in resolved) return resolved;
        const { bbox: effectiveBbox, routeLabel, resolvedAreas } = resolved;

        const result = await trafficIncidentDetails({ ...filters, bbox: effectiveBbox });

        const entryParams: TrafficIncidentDetailsByBBoxParams & { bbox: BBox } = {
            bbox: effectiveBbox,
            ...filters,
        };
        const capturedAt = Date.now();
        const entryLabel = label ?? defaultLabel(entryParams, effectiveWhere, routeLabel, resolvedAreas);

        // We write an emtpy entry for a zero-incident result to subsequent tool calls can still analyze it as valid data
        // resolvedAreas will catch mis-resolved areas in case of a query vs matched mistmatch
        if (!result.features.length) {
            const emptyId = await state.trafficIncidents.addIncidentsEntry([], entryParams, entryLabel, capturedAt);
            return {
                count: 0,
                entryId: emptyId,
                entries: entriesSummary(state),
                ...(resolvedAreas && resolvedAreas.length > 0 && { resolvedAreas }),
            };
        }

        const entryId = await state.trafficIncidents.addIncidentsEntry(
            result.features,
            entryParams,
            entryLabel,
            capturedAt,
        );

        if (show) {
            await state.trafficIncidents.showEntry(entryId, fitBounds);
        }

        // Monitoring rides along with the fetch (default on for a shown entry) so the agent no longer
        // has to co-pick a separate setTrafficIncidentsMonitor — that pairing was mandatory and
        // easy to forget. A hidden (show:false) throwaway load is never monitored. `skipInitialTick`
        // avoids re-fetching the area we just loaded; the recurring interval keeps it fresh.
        const monitoring = show && (monitor ?? true);
        if (monitoring) {
            state.trafficIncidents.startMonitoring(
                entryId,
                { bbox: effectiveBbox, capturedAt, label: entryLabel },
                { fetchIncidents: async (b) => (await trafficIncidentDetails({ ...filters, bbox: b })).features },
                { intervalMs: monitorIntervalMs, skipInitialTick: true },
            );
        }

        return {
            count: result.features.length,
            entryId,
            entries: entriesSummary(state),
            monitoring,
            ...(resolvedAreas && resolvedAreas.length > 0 && { resolvedAreas }),
        };
    } catch (error) {
        return {
            error: `Failed to get traffic incidents: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
