/**
 * @module agent-toolkit-tools
 */

import type { BBox, Place } from '@tomtom-org/maps-sdk/core';
import { bboxCenter, bboxFromGeoJSON, getPosition } from '@tomtom-org/maps-sdk/core';
import * as turf from '@turf/turf';
import type { Feature, MultiPolygon, Polygon, Position } from 'geojson';
import { placeAreaLabel } from '../../utils';
import type { QueryAs } from './locate-places';
import type { AreaWhere } from './schema';

export type WhereContext = {
    // Current map viewport, read once for both the `within` viewport fallback and the
    // `nearby`/query-rerank bias point — same underlying map read either way.
    viewport(): { bbox?: BBox; center?: Position };
    // Expands an ENTRY id to the feature ids of its geometry-bearing places. `undefined` when no
    // such entry exists (caller falls back to treating the id as a place feature id); `[]` when the
    // entry exists but holds no geometry-bearing place.
    expandEntry(id: string): string[] | undefined;
    // `queryAs` set → nearby's point-bias resolution (POI/place search via locatePlaces, any
    // geography). `queryAs` omitted → within's area resolution, restricted to administrative AREA
    // geographies (streets/POIs filtered out) so every result carries a usable bbox.
    geocodeAreas(query: string, queryAs?: QueryAs, bias?: Position): Promise<Place[]>;
    // Fetches a boundary polygon — by session place id (resolved + cached against its owning entry;
    // `undefined` covers "unknown id", "no geometry data source", and "fetch returned nothing" alike)
    // or directly for an already-resolved `Place` (a fresh geocode candidate with nothing to cache
    // against). Both paths hit the same Geometry Data call underneath.
    fetchGeometry(place: Place | string): Promise<Feature<Polygon | MultiPolygon> | undefined>;
    // Returns the route's geometry features (one per alternative) plus its display label, or a
    // specific `{ error }` explaining why no route is available (none calculated yet / id not found
    // / entry has no geometry) so resolveRouteToAreas can surface an actionable message.
    getRoute(routeId?: string): { features: Feature[]; label: string } | { error: string };
};

export type ResolveAreasOptions = {
    kind: ResolveKind;
};

export type ResolveKind = 'within' | 'nearby' | 'global';
export type AreaSource = 'viewport' | 'boundingBox' | 'query' | 'placeId' | 'geometries' | 'route';

// Single entrypoint for every `where`-mode resolution — takes the mode as `kind` and branches to
// the matching resolver. `within` and `nearby` need `where`/`ctx`; `global` needs neither.
export function resolveWhere(opts: ResolveAreasOptions, where?: AreaWhere, ctx?: WhereContext) {
    switch (opts.kind) {
        case 'within':
            return resolveWithin(where as AreaWhere, ctx as WhereContext);
        case 'nearby':
            return resolveNearby(where as AreaWhere, ctx as WhereContext);
        case 'global':
            return resolveGlobal();
    }
}

// The search scope for `within` — every explicit field resolves to its own area(s) and they're
// unioned together; the viewport is used only as a fallback when nothing explicit resolved.
export const resolveWithin = (where: AreaWhere, ctx: WhereContext): Promise<ResolvedArea[] | ResolveError> =>
    gatherCandidates(gatherInputs(where, ctx), ctx);

// The bias point for `nearby` — one point, never an area. Unresolvable input is not an error, it's
// just "no bias" ({}), so the caller widens the search instead of failing it.
export const resolveNearby = async (where: AreaWhere, ctx: WhereContext): Promise<ResolvedBias> => {
    const input = gatherInputs(where, ctx);
    const center = input.mapViewport.center;

    if (!input.queries?.length) {
        return input.useViewport && center ? { position: center } : {};
    }

    const candidates = await geocodeQueryCandidates(input, ctx, center);
    if (candidates.length === 0) {
        return {};
    }
    const position = getPosition(candidates[0]);
    if (!position) {
        return {};
    }
    const label = placeAreaLabel(candidates[0]);
    return { position, query: input.queries[0].query, ...(label && { label }) };
};

// Nothing to resolve — `global` carries no `where` fields at all.
export const resolveGlobal = (): ResolvedBias => ({});

type LocateInputs = {
    useViewport: AreaWhere['viewport'];
    mapViewport: ReturnType<WhereContext['viewport']>;
    boundingBox: AreaWhere['boundingBox'];
    queries: AreaWhere['queries'];
    placeIds: AreaWhere['placeIds'];
    geometries: AreaWhere['geometries'];
    route: AreaWhere['route'];
};

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

export type ResolveError = { error: string };

// The nearby-mode counterpart to ResolvedArea — one bias point instead of a region. `position`
// absent means "couldn't resolve a bias," which is a valid, non-error outcome (see resolveNearby).
export type ResolvedBias = { position?: Position; label?: string; query?: string };

// The grounded match for a resolved query — `matched` is the place the data was actually loaded
// for, not the query echo. Callers derive this from ResolvedArea[]/ResolvedBias to surface where a
// query resolved (see discover-places.ts, get-traffic-incidents.ts).
export type ResolvedAreaDisclosure = { query?: string; matched: string };

export const isResolveError = (r: unknown): r is ResolveError => typeof r === 'object' && r !== null && 'error' in r;

const gatherInputs = (where: AreaWhere, ctx: WhereContext): LocateInputs => {
    const { viewport: useViewport, boundingBox, queries, placeIds, geometries, route } = where;
    const mapViewport = ctx.viewport();
    return { useViewport, boundingBox, queries, placeIds, geometries, route, mapViewport };
};

// Resolves every explicit within-mode field to its own area(s) and unions them. Explicit input
// always wins outright; the viewport is only used if nothing explicit resolved to anything. Each
// `queries` entry is narrowed to its own single winner (geocode -> rerank -> pick top -> optional
// boundary fetch) before joining the pool, so an ambiguous name can't leave several wrong-location
// matches in the final unioned scope. A failed query/placeId/route aborts the whole resolve; a
// degenerate `geometries` entry is just skipped — see the reference block below for why.
const gatherCandidates = async (inputs: LocateInputs, ctx: WhereContext): Promise<ResolvedArea[] | ResolveError> => {
    const { useViewport, boundingBox, queries, placeIds, geometries, route, mapViewport } = inputs;
    const candidates: ResolvedArea[] = [];

    if (boundingBox) {
        candidates.push({ bbox: boundingBox as BBox, source: 'boundingBox' });
    }

    const queryCandidates = await resolveQueryCandidates(queries, ctx, mapViewport);
    if (isResolveError(queryCandidates)) return queryCandidates;
    candidates.push(...queryCandidates);

    const placeIdCandidates = await resolvePlaceIdCandidates(placeIds, ctx);
    if (isResolveError(placeIdCandidates)) return placeIdCandidates;
    candidates.push(...placeIdCandidates, ...resolveGeometryCandidates(geometries));

    if (route) {
        const routeCandidates = await resolveRouteCandidates(route, ctx);
        if (isResolveError(routeCandidates)) return routeCandidates;
        candidates.push(...routeCandidates);
    }

    if (candidates.length > 0) return candidates;

    if (useViewport) {
        // Explicitly requested and unavailable is a real failure, unlike "nothing was requested."
        if (!mapViewport.bbox) return { error: 'No map viewport available to resolve as an area.' };
        return [{ bbox: mapViewport.bbox, source: 'viewport' }];
    }

    // Nothing explicit resolved (or nothing was given at all) — an empty scope, not an error, so a
    // caller composing this with its own scope (e.g. `range`) can decide whether that's a problem.
    return candidates;
};

// Each `queries` entry is narrowed to its own single winner (geocode -> rerank -> pick top ->
// optional boundary fetch) before joining the pool, so an ambiguous name can't leave several
// wrong-location matches in the final unioned scope.
const resolveQueryCandidates = async (
    queries: LocateInputs['queries'],
    ctx: WhereContext,
    mapViewport: LocateInputs['mapViewport'],
): Promise<ResolvedArea[] | ResolveError> => {
    const candidates: ResolvedArea[] = [];
    for (const { query } of queries ?? []) {
        const matches = (await ctx.geocodeAreas(query, undefined, mapViewport.center)).filter((p) => p.bbox);
        if (matches.length === 0) {
            return {
                error: `Could not resolve "${query}" to an area. Provide a boundingBox or a more specific place.`,
            };
        }
        const top = (mapViewport.center ? rerankWithNearestCandidate(matches, mapViewport.center) : matches)[0];
        const label = placeAreaLabel(top);
        const feature = top.properties.dataSources?.geometry?.id ? await ctx.fetchGeometry(top) : undefined;
        candidates.push(
            feature
                ? {
                      bbox: (feature.bbox as BBox | undefined) ?? (bboxFromGeoJSON(feature) as BBox),
                      polygon: feature.geometry,
                      label,
                      source: 'query',
                      query,
                  }
                : { bbox: top.bbox as BBox, label, source: 'query', query },
        );
    }
    return candidates;
};

const resolvePlaceIdCandidates = async (
    placeIds: LocateInputs['placeIds'],
    ctx: WhereContext,
): Promise<ResolvedArea[] | ResolveError> => {
    const candidates: ResolvedArea[] = [];
    for (const id of placeIds ?? []) {
        const entryIds = ctx.expandEntry(id);
        if (entryIds?.length === 0) {
            return {
                error: `Places entry "${id}" has no place with a geometry data source. Provide a boundingBox or a different entry.`,
            };
        }
        for (const placeId of entryIds ?? [id]) {
            const feature = await ctx.fetchGeometry(placeId);
            if (!feature) {
                return {
                    error: `Unknown placeId "${placeId}" or it has no fetchable geometry. Use recallState to list available IDs.`,
                };
            }
            candidates.push({ bbox: bboxFromGeoJSON(feature) as BBox, polygon: feature.geometry, source: 'placeId' });
        }
    }
    return candidates;
};

// A degenerate entry (no bbox derivable) is just skipped, not an error — see gatherCandidates.
const resolveGeometryCandidates = (geometries: LocateInputs['geometries']): ResolvedArea[] => {
    const candidates: ResolvedArea[] = [];
    for (const polygon of geometries ?? []) {
        const bbox = bboxFromGeoJSON(polygon);
        if (bbox) candidates.push({ bbox, polygon, source: 'geometries' });
    }
    return candidates;
};

const resolveRouteCandidates = async (
    route: NonNullable<LocateInputs['route']>,
    ctx: WhereContext,
): Promise<ResolvedArea[] | ResolveError> => {
    const entry = ctx.getRoute(route.routeId);
    if ('error' in entry) return entry;

    const routeAreas: ResolvedArea[] = [];
    for (const feature of entry.features) {
        const buffered = turf.buffer(feature, route.widthMeters / 2, { units: 'meters' });
        if (buffered) {
            routeAreas.push({
                bbox: bboxFromGeoJSON(buffered as Feature) as BBox,
                polygon: buffered.geometry as Polygon | MultiPolygon,
                label: entry.label,
                source: 'route',
            });
        }
    }
    if (routeAreas.length === 0) return { error: 'Route produced no corridor geometry.' };
    return routeAreas;
};

// Reorders geocode candidates by averaging two rank positions: the geocoder's own relevance order
// and a distance-to-viewport order computed here — so a top-ranked but far candidate can still lose
// to a lower-ranked but much closer one, and vice versa.
const rerankWithNearestCandidate = (candidates: Place[], center: Position): Place[] => {
    const DISTANCE_TIE_BUFFER_KM = 1000;

    const sortedFromDistance = [...candidates].sort((a, b) => {
        if (a.bbox === undefined || b.bbox === undefined) return 0;
        const distA = turf.distance(bboxCenter(a.bbox), center);
        const distB = turf.distance(bboxCenter(b.bbox), center);
        const diff = distA - distB;
        return Math.abs(diff) > DISTANCE_TIE_BUFFER_KM ? diff : 0;
    });

    const scored = candidates.map((place, geocoderRank) => ({
        place,
        rank: (geocoderRank + sortedFromDistance.indexOf(place)) / 2,
    }));

    return scored.toSorted((a, b) => a.rank - b.rank).map((a) => a.place);
};

// Geocode candidates for nearby's `query` bias — POI-or-place search (never area-restricted), kept
// flat since nearby only ever expects one meaningful query. No rerank here: nearby trusts the
// geocoder's own top result as-is, unlike within's per-query resolution above. An unresolved query
// is skipped, not an error — nearby's bias is tolerant of "not found" (see resolveNearby), and the
// within-flavored "Provide a boundingBox" message would be misleading for this POI/place search path.
const geocodeQueryCandidates = async (input: LocateInputs, ctx: WhereContext, bias?: Position): Promise<Place[]> => {
    const candidates: Place[] = [];
    for (const { query, queryAs } of input.queries ?? []) {
        const matches = await ctx.geocodeAreas(query, queryAs, bias);
        candidates.push(...matches);
    }
    return candidates;
};
