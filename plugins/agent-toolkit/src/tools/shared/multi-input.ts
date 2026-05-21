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
 * `merged + byEntry` views, and returns the resolved entries so the analyse
 * path can attach an analysis to each contributing entry afterwards.
 */

import type { Place, PolygonFeature, Route, TrafficAreaAnalytics, TrafficIncident } from '@tomtom-org/maps-sdk/core';
import type { FeatureCollection as GeoJSONFeatureCollection } from 'geojson';
import type {
    BYODEntry,
    PlacesEntry,
    RoutesEntry,
    TrafficAreaAnalyticsEntry,
    TrafficIncidentsEntry,
} from '../../state';
import type { ToolState } from '../../types';
import type { GeometriesId } from './geometries-id';
import { type AffectedEntry, collectInputGeometries, type SkippedSource } from './state-inputs';

type FeatureCollection<F> = { type: 'FeatureCollection'; features: F[] };

/** Inputs the LLM passes through the tool schema. All optional, but at least one must be set. */
export type MultiInputIds = {
    placesEntryIDs?: readonly string[];
    routesEntryIDs?: readonly string[];
    incidentsEntryIDs?: readonly string[];
    geometriesEntryIDs?: readonly GeometriesId[];
    trafficAreaAnalyticsEntryIDs?: readonly string[];
    byodEntryIDs?: readonly string[];
};

/** Resolved entries, kept for the attach step in analyseData. Empty arrays for kinds the caller didn't request. */
export type ResolvedEntries = {
    places: PlacesEntry[];
    routes: RoutesEntry[];
    incidents: TrafficIncidentsEntry[];
    trafficAreaAnalytics: TrafficAreaAnalyticsEntry[];
    byod: BYODEntry[];
};

/** Sandbox-facing inputs. Each field is `undefined` when its kind wasn't requested. */
export type SandboxInputs = {
    places: FeatureCollection<Place> | undefined;
    placesByEntry: Record<string, FeatureCollection<Place>> | undefined;
    routes: FeatureCollection<Route> | undefined;
    routesByEntry: Record<string, FeatureCollection<Route>> | undefined;
    incidents: TrafficIncident[] | undefined;
    incidentsByEntry: Record<string, TrafficIncident[]> | undefined;
    geometries: PolygonFeature[] | undefined;
    /**
     * Merged TrafficAreaAnalytics FeatureCollection — every feature is a tile/hex region with
     * the metric properties from the SDK (`congestionLevel`, `speed`, `travelTime`, …). When
     * multiple entries are requested, their features are concatenated; `trafficAreaAnalyticsByEntry`
     * keeps them separate.
     */
    trafficAreaAnalytics: TrafficAreaAnalytics | undefined;
    trafficAreaAnalyticsByEntry: Record<string, TrafficAreaAnalytics> | undefined;
    /**
     * Merged BYOD FeatureCollection. Each requested entry contributes its features; mixed
     * geometry types are normal (BYOD layers can be Point / LineString / Polygon). When multiple
     * entries are requested they're concatenated; `byodByEntry` keeps them separate.
     */
    byod: GeoJSONFeatureCollection | undefined;
    byodByEntry: Record<string, GeoJSONFeatureCollection> | undefined;
};

/** Geometries metadata — only populated when `geometriesEntryIDs` was passed. */
export type GeometriesMeta = {
    affectedEntries: AffectedEntry[];
    sourceIds: GeometriesId[];
    skipped: SkippedSource[];
};

export type PreparedInputs = {
    resolved: ResolvedEntries;
    sandbox: SandboxInputs;
    geometries: GeometriesMeta;
};

/**
 * Resolve every requested input kind, build sandbox views, and surface the
 * resolved entries to the caller. The caller (analyseData / processData) is
 * responsible for enforcing "at least one input must be set" via the zod
 * schema; this helper enforces it as a safety net.
 *
 * @ignore
 */
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
        missingId: (id) => `No places entry with id "${id}". Use recallPlaces to list available IDs.`,
    });
    if ('error' in placesResult) return placesResult;

    const routesResult = resolveSliceEntries(ids.routesEntryIDs, state.routing, {
        missingId: (id) => `No routes entry with id "${id}". Use recallRoutes to list available IDs.`,
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
        missingId: (id) => `No BYOD entry with id "${id}". Use recallByod to list available IDs.`,
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

export const prepareMultiInputs = async (
    ids: MultiInputIds,
    state: ToolState,
): Promise<{ value: PreparedInputs } | { error: string }> => {
    if (!hasAnyInput(ids)) {
        return {
            error:
                'At least one of `placesEntryIDs`, `routesEntryIDs`, `incidentsEntryIDs`, ' +
                '`geometriesEntryIDs`, `trafficAreaAnalyticsEntryIDs`, `byodEntryIDs` must be set. ' +
                'Use `recallPlaces` / `recallRoutes` / `recallGeometries` / `recallByod` / `recallState` to list available ids.',
        };
    }

    const resolved = resolveAllSlices(ids, state);
    if ('error' in resolved) return resolved;
    const {
        places: placesEntries,
        routes: routesEntries,
        incidents: incidentsEntries,
        trafficAreaAnalytics: trafficAreaAnalyticsEntries,
        byod: byodEntries,
    } = resolved.value;

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
            resolved: {
                places: placesEntries,
                routes: routesEntries,
                incidents: incidentsEntries,
                trafficAreaAnalytics: trafficAreaAnalyticsEntries,
                byod: byodEntries,
            },
            sandbox: {
                places: placesEntries.length
                    ? { type: 'FeatureCollection', features: placesEntries.flatMap((e) => e.places) }
                    : undefined,
                placesByEntry: placesEntries.length
                    ? Object.fromEntries(
                          placesEntries.map((e) => [
                              e.id,
                              { type: 'FeatureCollection', features: [...e.places] } as FeatureCollection<Place>,
                          ]),
                      )
                    : undefined,
                routes: routesEntries.length
                    ? { type: 'FeatureCollection', features: routesEntries.flatMap((e) => e.data.features) }
                    : undefined,
                routesByEntry: routesEntries.length
                    ? Object.fromEntries(
                          routesEntries.map((e) => [
                              e.id,
                              {
                                  type: 'FeatureCollection',
                                  features: [...e.data.features],
                              } as FeatureCollection<Route>,
                          ]),
                      )
                    : undefined,
                incidents: incidentsEntries.length ? incidentsEntries.flatMap((e) => e.data) : undefined,
                incidentsByEntry: incidentsEntries.length
                    ? Object.fromEntries(incidentsEntries.map((e) => [e.id, [...e.data]]))
                    : undefined,
                geometries,
                trafficAreaAnalytics: trafficAreaAnalyticsEntries.length
                    ? mergeTrafficAreaAnalytics(trafficAreaAnalyticsEntries.map((e) => e.data))
                    : undefined,
                trafficAreaAnalyticsByEntry: trafficAreaAnalyticsEntries.length
                    ? Object.fromEntries(trafficAreaAnalyticsEntries.map((e) => [e.id, e.data]))
                    : undefined,
                byod: byodEntries.length
                    ? {
                          type: 'FeatureCollection',
                          features: byodEntries.flatMap((e) => e.data.features),
                      }
                    : undefined,
                byodByEntry: byodEntries.length
                    ? Object.fromEntries(byodEntries.map((e) => [e.id, e.data]))
                    : undefined,
            },
            geometries: geometriesMeta,
        },
    };
};

// Concatenate features from N TrafficAreaAnalytics entries into a single FeatureCollection.
// Collection-level `properties` (metrics list, date range) are taken from the first entry —
// the LLM should treat the merged collection as feature-level when ids span different requests.
const mergeTrafficAreaAnalytics = (entries: readonly TrafficAreaAnalytics[]): TrafficAreaAnalytics => ({
    type: 'FeatureCollection',
    properties: entries[0].properties,
    features: entries.flatMap((e) => e.features),
});

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
export const CROSS_KIND_OPS_DOC =
    'CROSS-KIND OPS — `turf` and `h3` operate on EVERY feature regardless of which input slot it came from. ' +
    'You can freely combine `places` (Points), `routes` (LineStrings), `incidents` (Point or LineString), ' +
    '`geometries` (Polygon / MultiPolygon), and `trafficAreaAnalytics` (Polygon tiles with `properties` like ' +
    '`congestionLevel` / `speed` / `travelTime` / `freeFlowSpeed`) in the same call. Common bridges:\n' +
    '• Point ↔ LineString — `turf.pointToLineDistance(point, lineFeature, { units: "meters" })`, ' +
    '`turf.nearestPointOnLine(line, point)`.\n' +
    '• Point ↔ Polygon — `turf.booleanPointInPolygon(point, poly)`, ' +
    '`turf.pointsWithinPolygon(turf.featureCollection(points), poly)`.\n' +
    '• LineString ↔ Polygon — `turf.lineIntersect(line, poly)`, `turf.booleanCrosses(line, poly)`, ' +
    '`turf.lineSplit(line, poly)`.\n' +
    '• Polygon ↔ Polygon — `turf.union/intersect/difference(turf.featureCollection([a, b]))` (Turf v7 takes a single collection).\n' +
    '• Point/LineString ↔ trafficAreaAnalytics tile — `turf.booleanPointInPolygon(p, tile)` for points; ' +
    '`turf.lineIntersect(routeLine, tile)` for routes; iterate `trafficAreaAnalytics.features` to find which ' +
    'tile a place/route segment falls into and read its metric (`tile.properties.congestionLevel`, etc.).\n' +
    '• Buffer to bridge kinds — `turf.buffer(anyFeature, meters/1000, { units: "kilometers" })` turns a point or ' +
    'line into a polygon you can then filter against.\n' +
    '• Bbox of anything — `turf.bbox(featureOrCollection)`.\n' +
    '• Centroid for Point↔shape distance — `turf.centroid(polygonOrLine).geometry.coordinates`.\n' +
    '• h3 — `h3.latLngToCell(lat, lng, res)` for any Point; `h3.polygonToCells(poly.geometry.coordinates, res)` ' +
    'for any Polygon; for a LineString iterate `geometry.coordinates` and bin each `[lng, lat]`.\n' +
    'Note: arguments to turf functions are GeoJSON Features — pass the whole feature (`places.features[i]`, ' +
    '`routes.features[0]`, `geometries[i]`, `incidents[i]`, `trafficAreaAnalytics.features[i]`), not the bare ' +
    '`geometry.coordinates` (a few helpers accept coords but most expect Features). Always check the function ' +
    'signature at https://turfjs.org/docs/.';

/** Names injected into the sandbox by analyseData / processData, in fixed order. */
export const MULTI_INPUT_SANDBOX_PARAMS = [
    'places',
    'placesByEntry',
    'routes',
    'routesByEntry',
    'incidents',
    'incidentsByEntry',
    'geometries',
    'trafficAreaAnalytics',
    'trafficAreaAnalyticsByEntry',
    'byod',
    'byodByEntry',
    'h3',
    'turf',
] as const;

/**
 * Pack `prepared.sandbox` into the positional argument array expected by
 * `runSandboxedFn`, in the same order as {@link MULTI_INPUT_SANDBOX_PARAMS}.
 * Trailing `h3` and `turf` are supplied by the caller.
 *
 * @ignore
 */
export const packSandboxArgs = (sandbox: SandboxInputs, libs: { h3: unknown; turf: unknown }): readonly unknown[] => [
    sandbox.places,
    sandbox.placesByEntry,
    sandbox.routes,
    sandbox.routesByEntry,
    sandbox.incidents,
    sandbox.incidentsByEntry,
    sandbox.geometries,
    sandbox.trafficAreaAnalytics,
    sandbox.trafficAreaAnalyticsByEntry,
    sandbox.byod,
    sandbox.byodByEntry,
    libs.h3,
    libs.turf,
];
