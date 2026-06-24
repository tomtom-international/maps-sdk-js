/**
 * @module agent-toolkit-tools
 *
 * `recallState` — the single read-only window onto session state. Three modes:
 * - no args → a session SNAPSHOT (places/routes/ranges index + map style / POIs / traffic configs);
 * - `kind` only → that kind's entry INDEX (ids + labels + per-kind summary fields);
 * - `kind` + `id` → that entry's DETAIL (full per-kind summary).
 *
 * Replaces the old per-kind `recallPlaces` / `recallRoutes` / `recallRanges` / `recallByod` /
 * `recallGeometries` tools — their logic lives on as internal executors this tool dispatches to.
 */

import type { StyleInput } from '@tomtom-org/maps-sdk/map';
import { z } from 'zod';
import type { DataEntryKind } from '../../state';
import type { FeatureFlags, ToolEntry, ToolEntryBuilder, ToolState } from '../../types';
import { type GeometriesId, geometriesIdSchema } from '../shared';
import { toolErrorSchema } from '../shared-output-schemas';
import { executeRecallByod, recallByodOutputSchema } from './recall-byod';
import { executeRecallGeometries, recallGeometriesOutputSchema } from './recall-geometries';
import { executeRecallIncidents, recallIncidentsOutputSchema } from './recall-incidents';
import { buildExecuteRecallPlaces, buildRecallPlacesOutputSchema } from './recall-places';
import { executeRecallRanges, recallRangesOutputSchema } from './recall-ranges';
import { executeRecallRoutes, recallRoutesOutputSchema } from './recall-routes';
import {
    executeRecallTrafficAreaAnalytics,
    recallTrafficAreaAnalyticsOutputSchema,
} from './recall-traffic-area-analytics';

const idLabelSchema = z.object({
    id: z.string(),
    label: z.string(),
});

const entryModeSchema = z.enum(['single', 'multiple']);

/** The no-args session snapshot — the original `recallState` shape. */
const snapshotSchema = z.object({
    places: z.array(idLabelSchema).describe('Places history entries — newest first.'),
    routes: z.array(idLabelSchema).describe('Routes history entries — newest first.'),
    ranges: z.array(idLabelSchema).describe('Reachable-range history entries — newest first.'),
    entryModes: z
        .object({ places: entryModeSchema, routes: entryModeSchema, ranges: entryModeSchema })
        .describe(
            'Per-slice display policy. `multiple` (default) lets several entries render at once; ' +
                '`single` keeps only the latest entry — set via setEntryMode tools.',
        ),
    mapStyle: z
        .object({
            id: z.string().optional().describe('Standard style id (e.g. "standardLight").'),
        })
        .nullable()
        .describe('Current map style. `null` when the map has no style assigned yet.'),
    mapPOIs: z
        .object({
            visible: z.boolean().optional(),
            filterMode: z.enum(['only', 'all_except']).optional(),
            categories: z.array(z.string()).optional(),
        })
        .nullable()
        .describe('Built-in POI overlay config. `null` when the POIsModule has not been initialised in this session.'),
    traffic: z
        .object({
            flow: z
                .object({ visible: z.boolean().optional() })
                .nullable()
                .describe('Traffic-flow layer config. `null` when the module is uninitialised.'),
            incidents: z
                .object({ visible: z.boolean().optional() })
                .nullable()
                .describe('Traffic-incidents layer config. `null` when the module is uninitialised.'),
        })
        .describe('Real-time traffic visualization configs.'),
});

/** Build the flag-aware output schema — snapshot OR any per-kind index/detail OR an error. */
export const buildRecallStateOutputSchema = (flags: FeatureFlags) =>
    z.union([
        snapshotSchema,
        buildRecallPlacesOutputSchema(flags),
        recallRoutesOutputSchema,
        recallRangesOutputSchema,
        recallByodOutputSchema,
        recallGeometriesOutputSchema,
        recallIncidentsOutputSchema,
        recallTrafficAreaAnalyticsOutputSchema,
        toolErrorSchema,
    ]);

/** Default-flag (`experimentalSearch: false`) output schema. */
export const recallStateOutputSchema = buildRecallStateOutputSchema({});

// LLM-facing kinds recallState can list/inspect — every entry-bearing slice. DERIVED from the
// canonical entry-kind vocabulary (`DataEntryKind`, the `dataEntries` superset) rather than
// re-spelled: the only divergence is that the `customGeometries` slice is surfaced under the shorter
// LLM-facing name `geometries`. Deriving via `Exclude` means adding/renaming a `DataEntryKind`
// propagates here (or trips the `satisfies` below) instead of drifting silently. The runtime array is
// still spelled out because `z.enum` needs the literal; `satisfies` pins it to the derived type.
export type RecallableKind = Exclude<DataEntryKind, 'customGeometries'> | 'geometries';
const recallableKinds = [
    'places',
    'routes',
    'ranges',
    'geometries',
    'byod',
    'incidents',
    'trafficAreaAnalytics',
] as const satisfies readonly RecallableKind[];

/** Tool schema for recall-state. */
export const recallStateSchema = z.object({
    kind: z
        .enum(recallableKinds)
        .optional()
        .describe(
            "Narrow to ONE entry kind: list that kind's entries (omit `id`) or inspect one (`id`). " +
                'Omit `kind` for a full session snapshot (places/routes/ranges index + map style / POIs / traffic).',
        ),
    id: z
        .union([z.string(), geometriesIdSchema])
        .optional()
        .describe(
            'Entry id to inspect in detail — requires `kind`. A plain id for places/routes/ranges/byod/incidents/' +
                'trafficAreaAnalytics (e.g. "places-3"); a tagged `{ kind, id }` for geometries. Omit to list the ' +
                "kind's entries.",
        ),
});

export const recallStateDescription =
    'Read-only window onto session state — the ONE tool for "what is already loaded?" and "which id can I pass ' +
    'to a `*EntryIDs` follow-up?". No args → session snapshot (places/routes/ranges entries + per-slice ' +
    "`entryMode` + map style / POIs / traffic configs). `kind` → that kind's entry index (places | routes | " +
    "ranges | geometries | byod | incidents | trafficAreaAnalytics). `kind` + `id` → that entry's full detail " +
    '(places coordinates, route legs, range polygons, BYOD profile, geometry features, incident delay breakdown, ' +
    'analytics metrics). ALWAYS call before referencing past entries; never guess ids. No service call.';

// Pulls the standard style id out of whatever `TomTomMap.getStyle()` returns:
// a bare string id or a `StandardStyle` object with `{ id, ... }`. Anything
// else (custom style) is reported as id-less.
const readStyleId = (style: StyleInput | undefined): string | undefined => {
    if (typeof style === 'string') return style;
    if (style && typeof style === 'object' && 'id' in style) {
        return (style as { id?: string }).id;
    }
    return undefined;
};

const snapshot = (state: ToolState): z.infer<typeof snapshotSchema> => {
    // Newest-first across each history. Same ordering the per-kind indexes use, so the LLM
    // doesn't have to re-sort.
    const byNewest = <T extends { timestamp: number }>(arr: readonly T[]): T[] =>
        [...arr].sort((a, b) => b.timestamp - a.timestamp);

    const places = byNewest(state.places.entries).map(({ id, label }) => ({ id, label }));
    const routes = byNewest(state.routing.entries).map(({ id, label }) => ({ id, label }));
    const ranges = byNewest(state.ranges.entries).map(({ id, label }) => ({ id, label }));

    const styleId = readStyleId(state.baseMap.ttMap.getStyle());
    const mapStyle = styleId === undefined ? null : { id: styleId };

    // Read POIs / traffic configs through the cached module accessors so we
    // don't lazy-init modules the user never touched (an uninitialised
    // module reports as `null`, which the LLM should read as "default state,
    // nothing modified").
    const poisModule = state.mapPOIs.poisModule;
    const poisConfig = poisModule?.getConfig();
    const mapPOIs = poisConfig
        ? {
              ...(typeof poisConfig.visible === 'boolean' && { visible: poisConfig.visible }),
              ...(poisConfig.filters?.categories?.show && {
                  filterMode: poisConfig.filters.categories.show,
              }),
              ...(poisConfig.filters?.categories?.values && {
                  categories: [...poisConfig.filters.categories.values],
              }),
          }
        : null;

    const flowConfig = state.trafficTiles.trafficFlowModule?.getConfig();
    const incidentsConfig = state.trafficTiles.trafficIncidentsModule?.getConfig();
    const traffic = {
        flow: flowConfig ? { ...(typeof flowConfig.visible === 'boolean' && { visible: flowConfig.visible }) } : null,
        incidents: incidentsConfig
            ? { ...(typeof incidentsConfig.visible === 'boolean' && { visible: incidentsConfig.visible }) }
            : null,
    };

    const entryModes = {
        places: state.places.entryMode,
        routes: state.routing.entryMode,
        ranges: state.ranges.entryMode,
    };

    return { places, routes, ranges, entryModes, mapStyle, mapPOIs, traffic };
};

/**
 * Build the recall-state executor for a given {@link FeatureFlags} bag (flags propagate to the
 * places detail's experimental fields). Dispatches to the per-kind executors when `kind` is set.
 */
export const buildExecuteRecallState =
    (flags: FeatureFlags) =>
    async (
        params: z.infer<typeof recallStateSchema>,
        state: ToolState,
    ): Promise<z.infer<ReturnType<typeof buildRecallStateOutputSchema>>> => {
        const { kind, id } = params;
        if (!kind) return snapshot(state);
        switch (kind) {
            case 'places':
                return buildExecuteRecallPlaces(flags)({ id: id as string | undefined }, state);
            case 'routes':
                return executeRecallRoutes({ id: id as string | undefined }, state);
            case 'ranges':
                return executeRecallRanges({ id: id as string | undefined }, state);
            case 'byod':
                return executeRecallByod({ id: id as string | undefined }, state);
            case 'incidents':
                return executeRecallIncidents({ id: id as string | undefined }, state);
            case 'trafficAreaAnalytics':
                return executeRecallTrafficAreaAnalytics({ id: id as string | undefined }, state);
            case 'geometries':
                return executeRecallGeometries({ id: id as GeometriesId | undefined }, state);
        }
    };

/** Default-flag (`experimentalSearch: false`) executor. */
export const executeRecallState = buildExecuteRecallState({});

const recallStateMetadata = {
    classificationPrompt:
        'Read session state: list / inspect loaded entries (places, routes, ranges, geometries, byod, incidents, ' +
        'trafficAreaAnalytics) and pick valid ids before any `*EntryIDs` follow-up (analyseData, processData, ' +
        'updatePlacesDisplay, …), or get a full snapshot of what is loaded. No args = snapshot; `kind` = that ' +
        "kind's index; `kind`+`id` = detail.",
    tags: ['state', 'recall', 'orientation'],
    examples: [
        'recallState()',
        'recallState({ kind: "places" })',
        'recallState({ kind: "places", id: "places-0" })',
        'recallState({ kind: "routes" })',
        'recallState({ kind: "geometries", id: { kind: "customGeometries", id: "buffered-routes" } })',
    ],
    examplePrompts: [
        'What is currently loaded in my session?',
        'What places did I search for?',
        'List my routes with their IDs',
        'What is in entry places-2?',
        'Which IDs can I pass to analyseData or processData?',
        'Show the BYOD layers I added',
    ],
    relatedTools: ['analyseData', 'processData', 'updatePlacesDisplay', 'updateRoutesDisplay', 'updateByodDisplay'],
    dependsOn: [
        'discoverPlaces',
        'locatePlace',
        'reverseGeocode',
        'setRoute',
        'findReachableAreas',
        'addByodSource',
        'processData',
        'getTrafficAreaAnalytics',
    ],
} satisfies Omit<ToolEntry, 'description' | 'inputSchema' | 'outputSchema' | 'execute'>;

/** Builder for the recallState default tool entry (flag-aware places detail). */
export const recallStateBuilder: ToolEntryBuilder = (options) => {
    const flags = options.featureFlags ?? {};
    return {
        ...recallStateMetadata,
        description: recallStateDescription,
        inputSchema: recallStateSchema,
        outputSchema: buildRecallStateOutputSchema(flags),
        execute: buildExecuteRecallState(flags) as ToolEntry['execute'],
    };
};
