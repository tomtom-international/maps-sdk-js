/**
 * @module agent-toolkit-tools
 *
 * Cross-slice input prep for the merged `analyseData` / `processData` tools.
 *
 * Per-type tools (analyse-places, process-routes, …) default to "use the last
 * entry of this slice" when their id array is omitted. The merged tools don't
 * do that: each input kind is purely opt-in. If `placesEntryIDs` is missing,
 * the sandbox sees `places === undefined`; if it's `[]`, same. The LLM
 * explicitly lists every kind it wants to consider.
 *
 * The helper resolves every requested kind, builds the sandbox-facing
 * per-entry (`<kind>ByEntry`) views, and returns the resolved entries so the
 * analyse path can attach an analysis to each contributing entry afterwards.
 */

import type { Place, PolygonFeature, Route, TrafficAreaAnalytics, TrafficIncident } from '@tomtom-org/maps-sdk/core';
import {
    calculateProgressAtRoutePoint,
    getCoordinateAtRouteProgress,
    getProgressAtNearestRoutePoint,
    getRouteProgressBetween,
    getRouteProgressForSection,
    getSectionBBox,
} from '@tomtom-org/maps-sdk/core';
import type { FeatureCollection as GeoJSONFeatureCollection } from 'geojson';
import type {
    BYODEntry,
    PlacesEntry,
    RoutesEntry,
    TrafficAreaAnalyticsEntry,
    TrafficIncidentsEntry,
} from '../../state';
import { clusterIncidents } from '../../state';
import type { EntryDataKind, ToolState } from '../../types';
import type { GeometriesId } from './geometries-id';
import { buildSandboxCodePrompt } from './sandbox-code';
import { type AffectedEntry, collectInputGeometries, type SkippedSource } from './state-inputs';

type FeatureCollection<F> = { type: 'FeatureCollection'; features: F[] };

/**
 * Inputs the LLM passes through the tool schema. All optional, but at least one must be set.
 *
 * @ignore
 */
export type MultiInputIds = {
    placesEntryIDs?: readonly string[];
    routesEntryIDs?: readonly string[];
    incidentsEntryIDs?: readonly string[];
    geometriesEntryIDs?: readonly GeometriesId[];
    trafficAreaAnalyticsEntryIDs?: readonly string[];
    byodEntryIDs?: readonly string[];
};

/**
 * Resolved entries, kept for the attach step in analyseData. Empty arrays for kinds the caller didn't request.
 *
 * @ignore
 */
export type ResolvedEntries = {
    places: PlacesEntry[];
    routes: RoutesEntry[];
    incidents: TrafficIncidentsEntry[];
    trafficAreaAnalytics: TrafficAreaAnalyticsEntry[];
    byod: BYODEntry[];
};

/** Newest `timestamp` across every resolved source entry, or undefined when none carry one. The
 * canonical `sampledAt` for a recurring sandbox run over these inputs. */
export const latestTimestamp = (resolved: ResolvedEntries): number | undefined => {
    let latest: number | undefined;
    for (const group of Object.values(resolved)) {
        for (const entry of group) {
            const timestamp = (entry as { timestamp?: unknown }).timestamp;
            if (typeof timestamp === 'number' && (latest === undefined || timestamp > latest)) latest = timestamp;
        }
    }
    return latest;
};

/**
 * Sandbox-facing inputs. Each kind is exposed as a single `<kind>ByEntry` record keyed by the entry id
 * the caller passed in `<kind>EntryIDs`; the field is `undefined` when its kind wasn't requested. There
 * is no flat/merged companion — code accesses one entry by id (`placesByEntry["places-2"]`) or merges
 * across entries explicitly with `Object.values(...)`, so it always stays aware of which entries it spans.
 *
 * @ignore
 */
export type SandboxInputs = {
    /**
     * Per-entry places, keyed by entry id. Each value is a FeatureCollection of that one entry's places.
     */
    placesByEntry: Record<string, FeatureCollection<Place>> | undefined;
    /**
     * Per-entry routes, keyed by entry id. Each value is a FeatureCollection of that one entry's routes.
     */
    routesByEntry: Record<string, FeatureCollection<Route>> | undefined;
    /**
     * Per-entry incidents, keyed by entry id. Each value is a plain array of that one entry's incidents.
     */
    incidentsByEntry: Record<string, TrafficIncident[]> | undefined;
    /**
     * Per-source polygons collected from every requested source (place / places / ranges / customGeometries).
     * Keyed by the tagged source `${kind}:${id}` (NOT a bare id: the same id can recur across kinds, e.g. a
     * `place` vs a `customGeometries` entry), so the kind stays unambiguous. Each feature also self-describes
     * its origin in `properties._source` (`{ kind, id }`).
     */
    geometriesByEntry: Record<string, PolygonFeature[]> | undefined;
    /**
     * Per-entry TrafficAreaAnalytics, keyed by entry id. Each value is a full FeatureCollection whose features
     * are tile/hex regions carrying the SDK metric properties (`congestionLevel`, `speed`, `travelTime`, …)
     * and whose collection-level `properties` (metrics list, date range) stay intact per entry.
     */
    trafficAreaAnalyticsByEntry: Record<string, TrafficAreaAnalytics> | undefined;
    /**
     * Per-entry BYOD, keyed by entry id. Each value is a FeatureCollection; mixed geometry types are normal
     * (BYOD layers can be Point / LineString / Polygon).
     */
    byodByEntry: Record<string, GeoJSONFeatureCollection> | undefined;
};

/**
 * Geometries metadata — only populated when `geometriesEntryIDs` was passed.
 *
 * @ignore
 */
export type GeometriesMeta = {
    affectedEntries: AffectedEntry[];
    sourceIds: GeometriesId[];
    skipped: SkippedSource[];
};

/**
 * Internal result of {@link prepareMultiInputs} — the resolved entries, the sandbox-facing views, and
 * the geometries metadata, bundled for the analyse / process tools.
 *
 * @ignore
 */
export type PreparedInputs = {
    resolved: ResolvedEntries;
    sandbox: SandboxInputs;
    geometries: GeometriesMeta;
};

// Per-id-array hint used by the "at least one input must be set" guard. Kept inline so the
// guard's error message stays accurate when new kinds get added.
const ID_FIELDS = [
    'placesEntryIDs',
    'routesEntryIDs',
    'incidentsEntryIDs',
    'geometriesEntryIDs',
    'trafficAreaAnalyticsEntryIDs',
    'byodEntryIDs',
] as const;

const hasAnyInput = (ids: MultiInputIds): boolean => ID_FIELDS.some((field) => (ids[field]?.length ?? 0) > 0);

// Pull the slice-resolution stack out of `prepareMultiInputs` so each function's cognitive
// complexity stays under the SonarQube cap. Returns the resolved entries grouped by kind, or
// the first per-slice resolution error encountered.
const resolveAllSlices = (ids: MultiInputIds, state: ToolState): { value: ResolvedEntries } | { error: string } => {
    const placesResult = resolveSliceEntries(ids.placesEntryIDs, state.places, {
        missingId: (id) => `No places entry with id "${id}". Use recallState to list available IDs.`,
    });
    if ('error' in placesResult) return placesResult;

    const routesResult = resolveSliceEntries(ids.routesEntryIDs, state.routing, {
        missingId: (id) => `No routes entry with id "${id}". Use recallState to list available IDs.`,
    });
    if ('error' in routesResult) return routesResult;

    const incidentsResult = resolveSliceEntries(ids.incidentsEntryIDs, state.trafficIncidents, {
        missingId: (id) => `No incidents entry with id "${id}". Call getTrafficIncidents first.`,
    });
    if ('error' in incidentsResult) return incidentsResult;

    const trafficAreaAnalyticsResult = resolveSliceEntries(
        ids.trafficAreaAnalyticsEntryIDs,
        state.trafficAreaAnalytics,
        {
            missingId: (id) => `No traffic-area-analytics entry with id "${id}". Call getTrafficAreaAnalytics first.`,
        },
    );
    if ('error' in trafficAreaAnalyticsResult) return trafficAreaAnalyticsResult;

    const byodResult = resolveSliceEntries(ids.byodEntryIDs, state.byod, {
        missingId: (id) => `No BYOD entry with id "${id}". Use recallState to list available IDs.`,
    });
    if ('error' in byodResult) return byodResult;

    return {
        value: {
            places: placesResult.value,
            routes: routesResult.value,
            incidents: incidentsResult.value,
            trafficAreaAnalytics: trafficAreaAnalyticsResult.value,
            byod: byodResult.value,
        },
    };
};

/**
 * Resolve every requested input kind, build the sandbox views, and surface the resolved entries to the
 * caller. The caller (analyseData / processData) enforces "at least one input must be set" via the zod
 * schema; this helper enforces it again as a safety net.
 *
 * @ignore
 */
export const prepareMultiInputs = async (
    ids: MultiInputIds,
    state: ToolState,
): Promise<{ value: PreparedInputs } | { error: string }> => {
    if (!hasAnyInput(ids)) {
        return {
            error:
                'At least one of `placesEntryIDs`, `routesEntryIDs`, `incidentsEntryIDs`, ' +
                '`geometriesEntryIDs`, `trafficAreaAnalyticsEntryIDs`, `byodEntryIDs` must be set. ' +
                'Use `recallState` (optionally with a `kind`) to list available ids.',
        };
    }

    const resolved = resolveAllSlices(ids, state);
    if ('error' in resolved) return resolved;

    let geometries: PolygonFeature[] | undefined;
    let geometriesMeta: GeometriesMeta = { affectedEntries: [], sourceIds: [], skipped: [] };
    if (ids.geometriesEntryIDs?.length) {
        const collected = await collectInputGeometries(ids.geometriesEntryIDs, state);
        if ('error' in collected) return collected;
        geometries = collected.value.geometries;
        geometriesMeta = {
            affectedEntries: collected.value.affectedEntries,
            sourceIds: collected.value.contributingSourceIds,
            skipped: collected.value.skipped,
        };
    }

    return {
        value: {
            resolved: resolved.value,
            sandbox: buildSandboxInputs(resolved.value, geometries),
            geometries: geometriesMeta,
        },
    };
};

// Assemble the sandbox-facing views from the resolved entries + collected geometries. Pulled out of
// `prepareMultiInputs` so its cognitive complexity stays under the SonarQube cap (same reason as
// `resolveAllSlices`). Every kind is a single `<kind>ByEntry` record keyed by entry id — there is no
// flat/merged companion. `geometries` is the one kind not resolved per-slice: its per-source view is a
// partition of the collected flat list by `_source` (see partitionGeometriesBySource).
const buildSandboxInputs = (resolved: ResolvedEntries, geometries: PolygonFeature[] | undefined): SandboxInputs => ({
    placesByEntry: resolved.places.length
        ? Object.fromEntries(resolved.places.map((e) => [e.id, { type: 'FeatureCollection', features: [...e.data] }]))
        : undefined,
    routesByEntry: resolved.routes.length
        ? Object.fromEntries(
              resolved.routes.map((e) => [e.id, { type: 'FeatureCollection', features: [...e.data.features] }]),
          )
        : undefined,
    incidentsByEntry: resolved.incidents.length
        ? Object.fromEntries(resolved.incidents.map((e) => [e.id, [...e.data]]))
        : undefined,
    geometriesByEntry: partitionGeometriesBySource(geometries),
    trafficAreaAnalyticsByEntry: resolved.trafficAreaAnalytics.length
        ? Object.fromEntries(resolved.trafficAreaAnalytics.map((e) => [e.id, e.data]))
        : undefined,
    byodByEntry: resolved.byod.length ? Object.fromEntries(resolved.byod.map((e) => [e.id, e.data])) : undefined,
});

// Partition the collected polygons into a per-source view, keyed by the tagged source `${kind}:${id}`.
// The geometries slot is polymorphic: one input (`geometriesEntryIDs`) spanning `place` (a single place
// id — not an entry in any slice), `places` (expands to many footprints), `ranges`, and `customGeometries`.
// So unlike every other kind there's no single slice whose `.entries` map to it — it can't be resolved
// per-entry the way places/routes/etc. are. The one thing common to all four sources is the `_source` tag
// `collectInputGeometries` stamps on each feature, so we group the flat list by that. The composite key is
// unambiguous: the same id can recur across kinds, so a bare id would collide.
const partitionGeometriesBySource = (
    geometries: readonly PolygonFeature[] | undefined,
): Record<string, PolygonFeature[]> | undefined => {
    if (!geometries?.length) return undefined;
    const byEntry: Record<string, PolygonFeature[]> = {};
    for (const feature of geometries) {
        const source = feature.properties?._source as GeometriesId | undefined;
        const key = source ? `${source.kind}:${source.id}` : 'unknown';
        const group = byEntry[key] ?? [];
        group.push(feature);
        byEntry[key] = group;
    }
    return byEntry;
};

const resolveSliceEntries = <E extends { id: string }>(
    ids: readonly string[] | undefined,
    slice: { entries: readonly E[] },
    hints: { missingId: (id: string) => string },
): { value: E[] } | { error: string } => {
    if (!ids?.length) return { value: [] };
    const out: E[] = [];
    for (const id of ids) {
        const found = slice.entries.find((entry) => entry.id === id);
        if (!found) return { error: hints.missingId(id) };
        out.push(found);
    }
    return { value: out };
};

/**
 * LLM-facing doc string that spells out which turf/h3 operations bridge across
 * input kinds. The merged tools both expose `places` (Points) / `routes`
 * (LineStrings) / `incidents` (Points + LineStrings) / `geometries` (Polygons
 * / MultiPolygons) / `trafficAreaAnalytics` (Polygon tiles with metrics) to
 * the same sandbox — but the model frequently assumes those slots are
 * isolated and gives up. Including this in the `code` field description
 * unblocks the common cross-kind work.
 *
 * @ignore
 */
const CROSS_KIND_OPS_DOC =
    'CROSS-KIND OPS — `turf` and `h3` operate on EVERY feature regardless of which entry/kind it came from. ' +
    'You can freely combine features from `placesByEntry` (Points), `routesByEntry` (LineStrings), ' +
    '`incidentsByEntry` (Point or LineString), `geometriesByEntry` (Polygon / MultiPolygon), and ' +
    '`trafficAreaAnalyticsByEntry` (Polygon tiles with `properties` like `congestionLevel` / `speed` / ' +
    '`travelTime` / `freeFlowSpeed`) in the same call. Pull features out of a record first — one entry ' +
    '`placesByEntry[id].features`, or all entries `Object.values(placesByEntry).flatMap(fc => fc.features)` ' +
    '(`Object.values(incidentsByEntry).flat()` for the array kinds). Common bridges:\n' +
    '• Point ↔ LineString — `turf.pointToLineDistance(point, lineFeature, { units: "meters" })`, ' +
    '`turf.nearestPointOnLine(line, point)`.\n' +
    '• Point ↔ Polygon — `turf.booleanPointInPolygon(point, poly)`, ' +
    '`turf.pointsWithinPolygon(turf.featureCollection(points), poly)`.\n' +
    '• LineString ↔ Polygon — `turf.lineIntersect(line, poly)`, `turf.booleanCrosses(line, poly)`, ' +
    '`turf.lineSplit(line, poly)`.\n' +
    '• Polygon ↔ Polygon — `turf.union/intersect/difference(turf.featureCollection([a, b]))` (Turf v7 takes a single collection).\n' +
    '• Point/LineString ↔ trafficAreaAnalytics tile — `turf.booleanPointInPolygon(p, tile)` for points; ' +
    "`turf.lineIntersect(routeLine, tile)` for routes; iterate a tile collection's `.features` " +
    '(e.g. `trafficAreaAnalyticsByEntry[id].features`) to find which tile a place/route segment falls into ' +
    'and read its metric (`tile.properties.congestionLevel`, etc.).\n' +
    '• Buffer to bridge kinds — `turf.buffer(anyFeature, meters/1000, { units: "kilometers" })` turns a point or ' +
    'line into a polygon you can then filter against.\n' +
    '• Bbox of anything — `turf.bbox(featureOrCollection)`.\n' +
    '• Centroid for Point↔shape distance — `turf.centroid(polygonOrLine).geometry.coordinates`.\n' +
    '• h3 — `h3.latLngToCell(lat, lng, res)` for any Point; `h3.polygonToCells(poly.geometry.coordinates, res)` ' +
    'for any Polygon; for a LineString iterate `geometry.coordinates` and bin each `[lng, lat]`.\n' +
    'Note: arguments to turf functions are GeoJSON Features — pass the whole feature ' +
    '(`placesByEntry[id].features[i]`, `routesByEntry[id].features[0]`, `geometriesByEntry[key][i]`, ' +
    '`incidentsByEntry[id][i]`, `trafficAreaAnalyticsByEntry[id].features[i]`), not the bare ' +
    '`geometry.coordinates` (a few helpers accept coords but most expect Features). Always check the function ' +
    'signature at https://turfjs.org/docs/.';

/**
 * Describes the per-entry input shape, surfaced by {@link buildSandboxToolsDoc} for every sandbox tool.
 * Each requested kind is a single `<kind>ByEntry` record keyed by entry id — there is no flat/merged
 * companion, so the model must access one entry by id or merge across entries explicitly. Spelling out
 * the merge idioms keeps the model from assuming a bare `places`/`routes` array exists (it doesn't).
 *
 * @ignore
 */
export const BY_ENTRY_VIEWS_DOC =
    'INPUTS (per-entry) — each requested kind is an object keyed by the id you passed in `<kind>EntryIDs`: ' +
    '`placesByEntry`, `routesByEntry`, `incidentsByEntry`, `trafficAreaAnalyticsByEntry`, `byodByEntry`. ' +
    "There is NO flat `places`/`routes`/… — only these per-entry records. Each value is that one entry's data: " +
    'a FeatureCollection (`placesByEntry`, `routesByEntry`, `byodByEntry`), a TrafficAreaAnalytics ' +
    'FeatureCollection (`trafficAreaAnalyticsByEntry`), or a plain array (`incidentsByEntry`).\n' +
    '• One entry — index by id: `placesByEntry["places-2"]` (a FeatureCollection → `turf.bbox(placesByEntry["places-2"])`).\n' +
    '• All requested entries of a kind — merge with `Object.values(...)`: ' +
    '`Object.values(placesByEntry).flatMap(fc => fc.features)` for FeatureCollection kinds (wrap with ' +
    '`turf.featureCollection(...)` before passing to turf), `Object.values(incidentsByEntry).flat()` for arrays.\n' +
    '• Per-entry / comparative work ("count per entry", "which route set is faster") — iterate the record\'s ' +
    'entries (`Object.entries(routesByEntry)`) so results stay labelled by source id.\n' +
    '`geometriesByEntry` is the odd one out: keyed by the tagged source `${kind}:${id}` (e.g. ' +
    '`"customGeometries:abc"`) rather than a bare id, since geometries mixes sources — each feature also ' +
    'carries `properties._source` (`{ kind, id }`).';

// `routeUtils` namespace — SDK route section/progress helpers, injected into BOTH
// analyseData and processData so any routes input can be sliced/measured without
// re-implementing it. The functions depend only on `@turf/turf` (available in the
// worker as `self.turf`) and pure local helpers, so the set is portable into the
// iframe-worker sandbox (see `sandbox/sdk-utils-worker-entry.ts`).
/**
 * @ignore
 */
export const routeUtils = {
    calculateProgressAtRoutePoint,
    getCoordinateAtRouteProgress,
    getProgressAtNearestRoutePoint,
    getRouteProgressBetween,
    getRouteProgressForSection,
    getSectionBBox,
} as const;

/**
 * Shared `routeUtils` reference doc, surfaced by both tools when `routes` is in scope. @ignore
 */
const ROUTE_UTILS_DOC =
    '`routeUtils` (route section / progress helpers, only useful when `routesEntryIDs` is set; each takes a ' +
    'single route feature, e.g. `routesByEntry[id].features[0]`; for a plain bounding box use `turf.bbox(route)`):\n' +
    '• `getSectionBBox(route, section)` → `[W,S,E,N]`. Sections at `route.properties.sections.<type>`.\n' +
    '• `getRouteProgressForSection(route, section)` / `getRouteProgressBetween(route, startIdx, endIdx)`.\n' +
    '• `calculateProgressAtRoutePoint(route, pathIndex)`.\n' +
    '• `getCoordinateAtRouteProgress(route, query)` — `query`: `{ traveledDistanceInMeters }` | `{ traveledTimeInSeconds }` | `{ clockTime: Date }`.\n' +
    '• `getProgressAtNearestRoutePoint(route, { lng, lat })` — snap a point to the line.';

/**
 * Names injected into the sandbox by analyseData / processData, in fixed order.
 *
 * @ignore
 */
export const MULTI_INPUT_SANDBOX_PARAMS = [
    'placesByEntry',
    'routesByEntry',
    'incidentsByEntry',
    'geometriesByEntry',
    'trafficAreaAnalyticsByEntry',
    'byodByEntry',
    'h3',
    'turf',
    'routeUtils',
    'cluster',
] as const;

/**
 * Shared `cluster` reference doc, surfaced by both tools when `incidents` is in scope. @ignore
 */
const CLUSTER_PRIMITIVE_DOC =
    '`cluster(incidents, params?, previous?, now?)` — DBSCAN clustering with stable IDs + trends (only ' +
    'useful with `incidentsEntryIDs`; `incidents` is an array — get it via ' +
    '`Object.values(incidentsByEntry).flat()` or one entry `incidentsByEntry[id]`; filter first, then cluster).\n' +
    '• `params`: `{ eps?, minMembers?, maxClusters?, preFilter? }` — `eps` km radius (default 0.5; ' +
    '0.3–0.5 urban, 1+ highways), `minMembers` (default 3), `maxClusters` top-N by delay (default 6).\n' +
    '• Returns `{ groups: [{ id, centroid, memberIds, size, totalDelaySeconds, peakDelaySeconds, ' +
    'diameterKm, primaryRoads, primaryCategory, trend }], sampledAt }`.\n' +
    '• Live trends: pass the injected `previous` + `now` — `return cluster(incidents, { eps: 0.4 }, previous, now);`. Omit both for one-shot.';

/**
 * Common "tools available in the sandbox" prompt section, shared verbatim by
 * analyseData and processData so the injected-library docs live in ONE place and the
 * two tools never drift. It documents the three function namespaces handed to every
 * sandbox body — `turf` / `h3` (base usage rules via {@link buildSandboxCodePrompt}),
 * the cross-kind turf cheat-sheet ({@link CROSS_KIND_OPS_DOC}), and `routeUtils`
 * ({@link ROUTE_UTILS_DOC}) — in a fixed order. The two scope-gated docs are appended
 * only when relevant: cross-kind when scope commits to more than one kind, routeUtils
 * when `routes` is in scope (matching the conditional `routeUtils` usefulness). Returns
 * a block ending in a blank line, ready to drop straight into either tool's `code` doc.
 *
 * @ignore
 */
export const buildSandboxToolsDoc = (active: readonly EntryDataKind[], scoped: boolean): string => {
    const crossKindDoc = scoped && active.length > 1 ? `\n\n${CROSS_KIND_OPS_DOC}` : '';
    const routeUtilsDoc = scoped && active.includes('routes') ? `\n\n${ROUTE_UTILS_DOC}` : '';
    const clusterDoc = scoped && active.includes('incidents') ? `\n\n${CLUSTER_PRIMITIVE_DOC}` : '';
    // Per-entry input guidance is ungated: every multi-input call receives the `<kind>ByEntry` records and
    // must know to index by id or merge with `Object.values`, regardless of how many entries are in scope.
    return `${buildSandboxCodePrompt(MULTI_INPUT_SANDBOX_PARAMS)}\n\n${BY_ENTRY_VIEWS_DOC}${crossKindDoc}${routeUtilsDoc}${clusterDoc}\n\n`;
};

/**
 * Pack `prepared.sandbox` into the positional argument array expected by
 * `runSandboxedFn`, in the same order as {@link MULTI_INPUT_SANDBOX_PARAMS}.
 *
 * The merged / per-entry views are shallow — their feature objects are the SAME
 * references held in the entry slices — so sandbox code must not mutate them in
 * place or it would corrupt live app state. We do NOT deep-copy here: the copy is
 * the executor's job, done exactly once and only where needed — the main-thread
 * executor `structuredClone`s the data args itself, while the iframe-worker
 * executor gets a copy for free as `postMessage` clones them across the worker
 * boundary. Cloning here too would be redundant double-work. Trailing `h3` / `turf` /
 * `routeUtils` / `cluster` are read-only function references, passed through untouched —
 * `routeUtils` is the shared {@link routeUtils} set and `cluster` is the
 * {@link clusterIncidents} primitive; both are injected into both tools. (In the
 * iframe-worker path these positions are dropped and refilled from the worker's own
 * globals — see {@link WORKER_PROVIDED_PARAMS} — so they must stay function references here.)
 *
 * @ignore
 */
export const packSandboxArgs = (sandbox: SandboxInputs, libs: { h3: unknown; turf: unknown }): readonly unknown[] => [
    sandbox.placesByEntry,
    sandbox.routesByEntry,
    sandbox.incidentsByEntry,
    sandbox.geometriesByEntry,
    sandbox.trafficAreaAnalyticsByEntry,
    sandbox.byodByEntry,
    libs.h3,
    libs.turf,
    routeUtils,
    clusterIncidents,
];
