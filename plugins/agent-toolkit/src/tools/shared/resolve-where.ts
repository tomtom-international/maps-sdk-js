/**
 * @module agent-toolkit-tools
 */

import type { BBox, Place } from '@tomtom-org/maps-sdk/core';
import { bboxCenter, bboxFromGeoJSON, getPosition } from '@tomtom-org/maps-sdk/core';
import * as turf from '@turf/turf';
import type { Feature, MultiPolygon, Polygon, Position } from 'geojson';
import { z } from 'zod';
import { placeAreaLabel } from '../../utils';
import type { QueryAs } from './locate-places';
import { areaWhereSchema } from './schema';

export type AreaSource = 'viewport' | 'boundingBox' | 'query' | 'placeId' | 'geometries' | 'route';

/** A resolved geographic area. `bbox` is always present; `polygon` is present when a precise
 * boundary was available (a Geography boundary or a buffered route corridor). */
export type ResolvedArea = {
    bbox: BBox;
    polygon?: Polygon | MultiPolygon;
    /** The GROUNDED match label — `freeformAddress, <countryCode>` for a `query` area — i.e. what the
     * data was actually loaded for, NOT the query echo. Lets a consumer surface where a query really
     * resolved. */
    label?: string;
    source: AreaSource;
    /** The input query text for a `query` area, echoed so a consumer can pair "asked" with the
     * grounded `label` ("matched"). Absent for non-query sources. */
    query?: string;
};

export type ResolveError = {
    error: string;
};

/** The `where` fields this module resolves. `range` is deliberately excluded — callers resolve it
 * themselves because the downstream endpoints differ (traffic bbox vs. searchInRange id).
 * Inferred from `areaWhereSchema` so the LLM-facing tool schemas and the resolver can't drift. */
export type AreaWhere = z.infer<typeof areaWhereSchema>;

/** Everything `resolveAreas` needs from the host, as a narrow port. `ToolState` satisfies this in
 * prod (see tool-state-where-context.ts); tests pass literal fakes. */
export type WhereContext = {
    viewportBBox(): BBox | undefined;
    viewportCenter(): Position | undefined;
    findPlaceById(id: string): Place | undefined;
    // Expands an ENTRY id to the feature ids of its geometry-bearing places. `undefined` when no
    // such entry exists (caller falls back to treating the id as a place feature id); `[]` when the
    // entry exists but holds no geometry-bearing place.
    geometryPlaceIdsForEntry(id: string): string[] | undefined;
    fetchPlaceGeometry(id: string): Promise<Feature | undefined>;
    geocodeArea(query: string, queryAs: QueryAs, bias?: Position): Promise<Place[]>;
    // Geocodes `query` restricted to administrative AREA geographies (streets/POIs filtered out), so
    // every result carries a bbox. `bias` (map centre) localizes ambiguous names; the resolver picks
    // the candidate nearest the view. Used for `within`-area resolution (geocodeArea stays for nearby).
    geocodeAreas(query: string, bias?: Position): Promise<Place[]>;
    fetchAreaPolygon(place: Place): Promise<Feature<Polygon | MultiPolygon> | undefined>;
    // Returns the route's geometry features (one per alternative) plus its display label, or a
    // specific `{ error }` explaining why no route is available (none calculated yet / id not found
    // / entry has no geometry) so resolveRouteToAreas can surface an actionable message.
    getRoute(routeId?: string): { features: Feature[]; label: string } | { error: string };
};

export const isResolveError = (r: unknown): r is ResolveError => typeof r === 'object' && r !== null && 'error' in r;

/** The point-bias `where` fields (`nearby` mode). Exactly one is set by the schema. */
export type BiasWhere = {
    viewport?: boolean;
    position?: Position;
    query?: { query: string; queryAs?: QueryAs };
};

/** A resolved point bias for a `nearby`-mode search. `position` is the bias point (absent when the
 * input was unresolvable — a tolerant no-bias widening, never an error). `query` + `label` are set
 * ONLY for the `query` sub-case — the grounded-resolution signal, identical in spirit to
 * {@link ResolvedArea}'s fields: a bias landing on a same-named place elsewhere silently skews
 * results to the wrong locale (e.g. "coffee near Springfield"). Consumers surface it via
 * {@link biasDisclosure}. */
export type ResolvedBias = {
    position?: Position;
    label?: string;
    query?: string;
};

// Resolves a `where` to a single bias point for point-biased searches (nearby mode). Tolerant by
// design — unlike resolveAreas, an unresolvable input yields no position (no bias = wider search),
// never an error. viewport → centre; position → passthrough; query → geocoded result's position
// (plus the grounded match label — see ResolvedBias).
export const resolveBiasPoint = async (where: BiasWhere, ctx: WhereContext): Promise<ResolvedBias> => {
    if (where.viewport) {
        // No viewport center → no bias (a `{}`, not `{ position: undefined }`), so the shape stays a
        // consistent "no bias" rather than an object that looks resolved until you read `position`.
        const center = ctx.viewportCenter();
        return center ? { position: center } : {};
    }
    if (where.position) return { position: where.position };
    if (where.query) {
        const { query, queryAs } = where.query;
        const center = ctx.viewportCenter();
        const [top] = await ctx.geocodeArea(query, queryAs ?? 'place', center);
        const position = top ? (getPosition(top) ?? undefined) : undefined;
        if (!position) return {};
        // `top` is necessarily defined here — `position` derives from it and we returned on `!position`.
        const label = placeAreaLabel(top);
        return {
            position,
            query,
            ...(label && { label }),
        };
    }
    return {};
};

// Maps a tool's raw `nearby`-mode `where` (flat viewport/position/query fields) onto the BiasWhere
// shape and resolves it via resolveBiasPoint. Shared by locatePlace and discoverPlaces, which differ
// only in how they wrap the result (and discover's independent radiusMeters cap + homonym signal).
export const resolveNearbyPosition = (
    where: { viewport?: true; position?: Position; query?: string; queryAs?: QueryAs },
    ctx: WhereContext,
): Promise<ResolvedBias> =>
    resolveBiasPoint(
        {
            viewport: where.viewport,
            position: where.position,
            query: where.query ? { query: where.query, queryAs: where.queryAs } : undefined,
        },
        ctx,
    );

export type ResolveAreasOptions = {
    /** Resolve `queries` to the top geocode candidate's own bbox only — skip the boundary-polygon
     * fetch and the geometry-source preference. For callers that consume only bboxes (traffic
     * incidents), this avoids an unnecessary Geometry Data call and the risk of a lower-ranked
     * area-with-a-boundary displacing the top result. Callers that need precise polygon filters
     * (discover-places) leave this off. */
    bboxOnlyQueries?: boolean;
};

// Collects the areas from the explicit (non-viewport) `where` fields, in input order. Returns a
// `ResolveError` as soon as any query / placeId / route fails so the caller surfaces the actionable
// message; degenerate geometries (no derivable bbox) are silently skipped, never erroring.
const collectExplicitAreas = async (
    where: AreaWhere,
    ctx: WhereContext,
    opts: ResolveAreasOptions,
): Promise<ResolvedArea[] | ResolveError> => {
    const areas: ResolvedArea[] = [];

    if (where.boundingBox) areas.push({ bbox: where.boundingBox as BBox, source: 'boundingBox' });

    for (const query of where.queries ?? []) {
        const area = await resolveQueryToArea(query, ctx, opts.bboxOnlyQueries ?? false);
        if (isResolveError(area)) return area;

        areas.push(area);
    }

    for (const placeId of where.placeIds ?? []) {
        const resolved = await resolvePlaceIdsInput(placeId, ctx);
        if (isResolveError(resolved)) return resolved;

        areas.push(...resolved);
    }

    for (const polygon of where.geometries ?? []) {
        // A degenerate polygon (e.g. empty coordinates) yields no bbox — skip it rather than
        // pushing an undefined bbox that would later break unionBBox.
        const bbox = bboxFromGeoJSON(polygon);
        if (bbox) areas.push({ bbox, polygon, source: 'geometries' });
    }

    if (where.route) {
        const routeAreas = resolveRouteToAreas(where.route, ctx);
        if (isResolveError(routeAreas)) return routeAreas;

        areas.push(...routeAreas);
    }

    return areas;
};

export const resolveAreas = async (
    where: AreaWhere,
    ctx: WhereContext,
    opts: ResolveAreasOptions = {},
): Promise<ResolvedArea[] | ResolveError> => {
    const hasMultiRegion =
        where.boundingBox !== undefined ||
        where.queries !== undefined ||
        where.placeIds !== undefined ||
        where.geometries !== undefined ||
        where.route !== undefined;

    const areas = await collectExplicitAreas(where, ctx, opts);
    if (isResolveError(areas)) return areas;

    // Resolved multi-region fields take precedence over the viewport (explicit intent beats the
    // ambient map). Keyed on what actually RESOLVED, not raw input length, so degenerate geometries
    // that produced no bbox don't suppress the viewport fallback below.
    if (areas.length > 0) return areas;

    if (where.viewport) {
        const bbox = ctx.viewportBBox();
        if (!bbox) return { error: 'No map viewport available to resolve as an area.' };

        return [{ bbox, source: 'viewport' }];
    }

    // Multi-region intent was present but resolved to nothing (e.g. all geometries degenerate) with
    // no viewport fallback — surface the empty set rather than an error, preserving prior behavior.
    if (hasMultiRegion) return areas;

    return {
        error: 'No area specified in `where` (provide viewport, boundingBox, queries, placeIds, geometries, or route).',
    };
};

export type ResolveWithinResult = {
    areas: ResolvedArea[];
    /** Display label of the route corridor, when the `where` resolved one — surfaced by callers
     * that build a human-readable scope label (traffic's defaultLabel, discover's entry label). */
    routeLabel?: string;
};

// Shared `within`-mode plumbing for discoverPlaces and getTrafficIncidents: applies the "any area
// input?" guard, delegates to resolveAreas, and lifts the route label out of the result. Returns
// `{ areas: [] }` (NOT an error) when the `where` carries no area input — callers may union in
// caller-side scope (e.g. a `range`) before deciding whether an empty result is an error. `range`
// itself is resolved caller-side (stored isochrones, not a geocoded area).
export const resolveWithinAreas = async (
    where: AreaWhere,
    ctx: WhereContext,
    opts: ResolveAreasOptions = {},
): Promise<ResolveWithinResult | ResolveError> => {
    const hasAreaInput =
        where.viewport ||
        where.boundingBox !== undefined ||
        where.queries !== undefined ||
        where.placeIds !== undefined ||
        where.geometries !== undefined ||
        where.route !== undefined;
    if (!hasAreaInput) return { areas: [] };

    const areas = await resolveAreas(where, ctx, opts);
    if (isResolveError(areas)) return areas;
    return { areas, routeLabel: areas.find((a) => a.source === 'route')?.label };
};

/** Assumes a non-empty array — callers must guard against empty input before calling. */
export const unionBBox = (bboxes: BBox[]): BBox => {
    let [minLng, minLat, maxLng, maxLat] = [
        Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        Number.NEGATIVE_INFINITY,
        Number.NEGATIVE_INFINITY,
    ];
    for (const bbox of bboxes) {
        if (bbox[0] < minLng) minLng = bbox[0];
        if (bbox[1] < minLat) minLat = bbox[1];
        if (bbox[2] > maxLng) maxLng = bbox[2];
        if (bbox[3] > maxLat) maxLat = bbox[3];
    }
    return [minLng, minLat, maxLng, maxLat];
};

/** Splits resolved areas into precise polygon filters and coarse bbox filters — the shape
 * discover-places' search endpoints consume. */
export const toMultiFilters = (
    areas: ResolvedArea[],
): { geometries: (Polygon | MultiPolygon)[]; boundingBoxes: BBox[] } => ({
    geometries: areas.filter((a) => a.polygon).map((a) => a.polygon as Polygon | MultiPolygon),
    boundingBoxes: areas.filter((a) => !a.polygon).map((a) => a.bbox),
});

// Resolves a query to a containing AREA. Geocodes restricted to area geographies (no streets/POIs —
// those drown the area otherwise), then picks the candidate nearest the current view, which
// disambiguates same-name areas ("Westminster" near London → London, not Maryland) without a hard
// viewport filter that would drop out-of-view queries (e.g. an operator viewing London asking about
// Birmingham). `queryAs` is ignored here — a `within` query is always resolved as an area, never a
// POI. `bboxOnly` (traffic) uses the picked area's bbox directly; otherwise (discover) its boundary
// polygon is fetched when the area exposes a geometry data source.
const resolveQueryToArea = async (
    q: { query: string; queryAs?: QueryAs },
    ctx: WhereContext,
    bboxOnly: boolean,
): Promise<ResolvedArea | ResolveError> => {
    const center = ctx.viewportCenter();
    const candidates = (await ctx.geocodeAreas(q.query, center)).filter((p) => p.bbox);
    if (candidates.length === 0) {
        return { error: `Could not resolve "${q.query}" to an area. Provide a boundingBox or a more specific place.` };
    }
    const place = center ? nearestArea(candidates, center) : candidates[0];
    // GROUNDED match only — never the query echo (a consumer's `matched` must be truthful; an area
    // whose geocode carries no address simply isn't disclosed). `label` still feeds the bbox/polygon
    // area used for the search regardless. `query` rides along so a consumer can pair "asked" with it.
    const label = placeAreaLabel(place);
    if (!bboxOnly && place.properties.dataSources?.geometry?.id) {
        const feature = await ctx.fetchAreaPolygon(place);
        if (feature) {
            return {
                bbox: (feature.bbox as BBox | undefined) ?? (bboxFromGeoJSON(feature) as BBox),
                polygon: feature.geometry,
                label,
                source: 'query',
                query: q.query,
            };
        }
    }
    return { bbox: place.bbox as BBox, label, source: 'query', query: q.query };
};

// Picks the area whose bbox centre is nearest `point` — disambiguates same-name areas by the current
// view without excluding out-of-view matches the way a hard bbox filter would.
const distToView = (bbox: BBox, point: Position): number => turf.distance(bboxCenter(bbox), point);
const nearestArea = (places: Place[], point: Position): Place =>
    places.reduce(
        (best, p) => (distToView(p.bbox as BBox, point) < distToView(best.bbox as BBox, point) ? p : best),
        places[0],
    );

/** The grounded resolution of a named `where` query — `matched` is the place the data was actually
 * loaded for (NOT the query echo). Surfaced so the agent knows where a query resolved and can
 * detect/correct a wrong same-name match. */
export type ResolvedAreaDisclosure = { query?: string; matched: string };

// A labelled resolution → its disclosure (needs a grounded `matched` label; raw bbox/geometry areas
// have none and are dropped). Shared by the area and bias paths so the shape can't drift.
const toDisclosure = (label: string | undefined, query: string | undefined): ResolvedAreaDisclosure | undefined =>
    label === undefined ? undefined : { ...(query !== undefined && { query }), matched: label };

// The grounded resolution of every geocoded `query` area, for a tool to surface as awareness (and a
// confirm cue). Scoped to `source === 'query'` — the only source that carries a geocoded match;
// boundingBox/geometry/route/placeId/viewport areas have nothing to disclose. For `within`-mode
// queries (discoverPlaces / getTrafficIncidents).
export const resolvedAreasDisclosure = (areas: ResolvedArea[]): ResolvedAreaDisclosure[] =>
    areas
        .filter((a) => a.source === 'query')
        .map((a) => toDisclosure(a.label, a.query))
        .filter((d): d is ResolvedAreaDisclosure => d !== undefined);

// Single-bias variant — the `nearby` point-bias path resolves ONE bias point, not an area list.
// Returns a 0-or-1 element array so callers thread it exactly like the within-mode result (and the
// output schema stays one `resolvedAreas` shape across modes).
export const biasDisclosure = (bias: ResolvedBias): ResolvedAreaDisclosure[] => {
    const d = toDisclosure(bias.label, bias.query);
    return d ? [d] : [];
};

// The grounded-match labels joined for an entry/scope label ("London, GB" — not the query echo).
// Undefined when nothing was disclosed, so callers fall back to their own label source. Shared by
// getTrafficIncidents' defaultLabel and discoverPlaces' entry label so "grounded label wins" lives
// in one place.
export const matchedAreasLabel = (resolvedAreas: ResolvedAreaDisclosure[] | undefined): string | undefined =>
    resolvedAreas && resolvedAreas.length > 0 ? resolvedAreas.map((a) => a.matched).join(', ') : undefined;

// Strict: a placeId must expose a geometry data source whose boundary we can fetch; a cached bbox
// alone is not accepted. Most addresses and streets have no such source.
const resolvePlaceIdToArea = async (id: string, ctx: WhereContext): Promise<ResolvedArea | ResolveError> => {
    const place = ctx.findPlaceById(id);
    if (!place) return { error: `Unknown placeId "${id}". Use recallState to list available IDs.` };
    if (!place.properties.dataSources?.geometry?.id) {
        return {
            error: `Place "${id}" has no geometry data source (most addresses and streets lack one). Provide a boundingBox or a different placeId.`,
        };
    }
    const feature = await ctx.fetchPlaceGeometry(id);
    if (!feature) return { error: `Geometry Data service returned no feature for place "${id}".` };
    return {
        bbox: bboxFromGeoJSON(feature) as BBox,
        polygon: feature.geometry as Polygon | MultiPolygon,
        source: 'placeId',
    };
};

// Resolves one `where.placeIds` entry to its area(s). The id may be an ENTRY id (from locatePlace's
// `placesEntryId`, discoverPlaces, or recallState — the same currency every `placesEntryIDs` tool
// accepts) or a single place FEATURE id. Entry ids expand to every geometry-bearing place they hold
// (each → one area, unioned downstream); a bare feature id resolves to one area. This unifies the
// id space so the agent can reuse the entry id it already has rather than digging out a feature id.
const resolvePlaceIdsInput = async (id: string, ctx: WhereContext): Promise<ResolvedArea[] | ResolveError> => {
    const entryPlaceIds = ctx.geometryPlaceIdsForEntry(id);

    // Not an entry id — treat it as a place feature id (legacy path).
    if (entryPlaceIds === undefined) {
        const area = await resolvePlaceIdToArea(id, ctx);
        return isResolveError(area) ? area : [area];
    }

    if (entryPlaceIds.length === 0) {
        return {
            error: `Places entry "${id}" has no place with a geometry data source (most addresses and streets lack one). Provide a boundingBox or a different entry.`,
        };
    }

    const areas: ResolvedArea[] = [];
    for (const placeId of entryPlaceIds) {
        const area = await resolvePlaceIdToArea(placeId, ctx);
        if (isResolveError(area)) return area;
        areas.push(area);
    }
    return areas;
};

// Buffers each route alternative into a corridor polygon (half the requested width on each side),
// matching the inline handling the tools did before. Units are meters — same as the source code
// this replaces (get-traffic-incidents.ts resolveRouteToBBoxes / discover-places resolveWithinRoute).
const resolveRouteToAreas = (
    route: { routeId?: string; widthMeters: number },
    ctx: WhereContext,
): ResolvedArea[] | ResolveError => {
    const entry = ctx.getRoute(route.routeId);
    if ('error' in entry) return entry;
    const radiusMeters = route.widthMeters / 2;
    const areas: ResolvedArea[] = [];
    for (const feature of entry.features) {
        const buffered = turf.buffer(feature, radiusMeters, { units: 'meters' });
        if (!buffered) continue;
        areas.push({
            bbox: bboxFromGeoJSON(buffered as Feature) as BBox,
            polygon: buffered.geometry as Polygon | MultiPolygon,
            label: entry.label,
            source: 'route',
        });
    }
    if (areas.length === 0) return { error: 'Route produced no corridor geometry.' };
    return areas;
};
