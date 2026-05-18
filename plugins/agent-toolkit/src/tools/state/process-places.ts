/**
 * @module agent-toolkit-tools
 */

import type { CommonPlaceProps, Places, PolygonFeature } from '@tomtom-org/maps-sdk/core';
import type { PlaceConnectionDisplay } from '@tomtom-org/maps-sdk/map';
import * as turf from '@turf/turf';
import * as h3 from 'h3-js';
import { z } from 'zod';
import type { FeatureFlags, ToolEntry, ToolEntryBuilder, ToolState } from '../../types';
import { summarizePlaces } from '../../utils';
import {
    applyFitOnMap,
    buildPlacesSchemaDoc,
    buildSandboxCodePrompt,
    FIT_ON_MAP_DOC,
    type FitOnMapInput,
    fittedReportSchema,
    GEOMETRIES_SCHEMA_DOC,
    isFitOnMapInput,
    isPolygonFeature,
    placesEntryIDsSchema,
    placesEntryIdHintSchema,
    runSandboxedFn,
    showModeSchema,
    shownSchema,
    showPlacesSchema,
    showResultsOnMap,
} from '../shared';
import { buildPlacesOutputSchema, toolErrorSchema } from '../shared-output-schemas';

// Render options for the produced `geometries`: mode and theme only — `show`
// is implicit (the code returned the polygons, the caller asked to render
// them by setting this object). Mirrors `showPlaceGeometriesSchema` but
// without the fetch/`show` knob, since we already have the geometries.
const showProducedGeometriesSchema = z.object({
    mode: showModeSchema,
    theme: z
        .enum(['filled', 'outline', 'inverted'])
        .optional()
        .describe('Visual theme for the polygons. Default: "outline".'),
});

const shownReportSchema = z.object({
    places: shownSchema.optional(),
    geometries: z
        .object({
            count: z.number(),
            theme: z.enum(['filled', 'outline', 'inverted']),
            mode: z.enum(['add', 'replace']),
        })
        .optional(),
});

/** Build the flag-aware output schema for process-places. */
export const buildProcessPlacesOutputSchema = (flags: FeatureFlags) =>
    z.union([
        buildPlacesOutputSchema(flags).extend({
            shown: shownReportSchema.optional(),
            placesEntryId: z.string().optional(),
            label: z.string().optional(),
            connectionsRendered: z
                .number()
                .optional()
                .describe(
                    'Number of connection lines drawn between the output places (when `placeConnections` was returned).',
                ),
            geometryCount: z
                .number()
                .optional()
                .describe(
                    'Number of polygons stored on the new entry under `geometries` (when the code returned a `geometries` array).',
                ),
            fitted: fittedReportSchema
                .optional()
                .describe('Bounds the camera was fit to (when the code returned `fitOnMap`).'),
        }),
        // Fit-only branch: code returned `fitOnMap` without `places` — camera moved, no entry written.
        z.object({
            fitted: fittedReportSchema,
        }),
        toolErrorSchema,
    ]);

/** Default-flag (`experimentalSearch: false`) output schema. */
export const processPlacesOutputSchema = buildProcessPlacesOutputSchema({});

/** Build the flag-aware tool schema for process-places. */
export const buildProcessPlacesSchema = (flags: FeatureFlags) =>
    z.object({
        placesEntryIDs: placesEntryIDsSchema({
            verb: 'process',
            extra: 'Multiple IDs are merged into a single `places` input. Sources are untouched; results go to a NEW entry.',
        }),
        code: z
            .string()
            .describe(
                'Async JS returning `{ places?, placeConnections?, geometries?, fitOnMap? }`. ' +
                    'Need at least one of `places` / `fitOnMap`; `placeConnections` and `geometries` attach to the new entry and require `places`. ' +
                    '`places`: FeatureCollection (filter/merge/subset of `places.features`) — written as a NEW entry. ' +
                    '`placeConnections`: `{ from, to, id?, ... }[]` between output places (endpoints: Place or place id). ' +
                    '`geometries`: `PolygonFeature[]` (Polygon/MultiPolygon, stable `id` recommended). ' +
                    '`fitOnMap`: see below. ' +
                    'Inputs: `places` merges all `placesEntryIDs`; `placesByEntry[id]` keeps them separate for set ops (diff/intersection/group-by-source). ' +
                    'List every needed id in `placesEntryIDs` — the sandbox cannot call other tools. ' +
                    '`geometries` arg is empty unless `withGeometries: true`.\n\n' +
                    `${buildSandboxCodePrompt(['places', 'placesByEntry', 'geometries', 'h3', 'turf'])}\n\n` +
                    `${FIT_ON_MAP_DOC}\n\n` +
                    `${buildPlacesSchemaDoc(flags)}\n\n` +
                    `${GEOMETRIES_SCHEMA_DOC}\n\n` +
                    'Examples:\n' +
                    '- filter: `return { places: { type: "FeatureCollection", features: places.features.filter(p => p.properties.poi?.name?.toLowerCase().includes("vegan")) } };`\n' +
                    '- diff between two entries (in `placesEntryIDs: ["A","B"]`): `const aIds = new Set(placesByEntry["A"].features.map(p => p.id)); return { places: { type: "FeatureCollection", features: placesByEntry["B"].features.filter(p => !aIds.has(p.id)) } };`\n' +
                    '- filter + connect: `const f = places.features.filter(p => p.properties.poi?.categories?.includes("CAFE")); return { places: { type: "FeatureCollection", features: f }, placeConnections: f.slice(1).map(p => ({ from: f[0], to: p })) };`\n' +
                    '- passthrough + star: `const [hub, ...rest] = places.features; return { places, placeConnections: rest.map(p => ({ from: hub, to: p })) };`\n' +
                    '- dbscan clusters → convex hulls: `const c = turf.clustersDbscan({type:"FeatureCollection",features:places.features}, 0.5, {units:"kilometers"}); const groups = {}; for (const f of c.features) { const k = f.properties.cluster; if (k != null) (groups[k] ||= []).push(f); } const hulls = Object.entries(groups).map(([k, fs]) => { const h = turf.convex({type:"FeatureCollection",features:fs}); if (h) { h.id = `cluster-${k}`; h.properties = { cluster: k, count: fs.length }; } return h; }).filter(Boolean); return { places, geometries: hulls };`\n' +
                    '- buffer footprints (needs `withGeometries: true`): `return { places, geometries: geometries.map((f, i) => ({ ...turf.buffer(f, 250, { units: "meters" }), id: `${f.id}-buf` })) };`\n' +
                    '- union footprints (needs `withGeometries: true`): `const u = geometries.reduce((a, f) => a ? turf.union(a, f) : f, null); return { places, geometries: u ? [u] : [] };`\n' +
                    '- h3 hex coverage of result places: `const cells = new Set(); for (const p of places.features) cells.add(h3.latLngToCell(p.geometry.coordinates[1], p.geometry.coordinates[0], 8)); return { places, geometries: [...cells].map((c) => turf.polygon([h3.cellToBoundary(c, true)], { cell: c, type: "h3-cell" })) };`\n' +
                    '- focus camera on filtered places (no new entry): `const f = places.features.filter(p => p.properties.poi?.categories?.includes("EV_STATION")); return { fitOnMap: turf.bbox({ type: "FeatureCollection", features: f }) };`\n' +
                    '- write entry AND zoom: `const f = places.features.filter(p => p.properties.poi?.name?.toLowerCase().includes("vegan")); return { places: { type: "FeatureCollection", features: f }, fitOnMap: { bbox: turf.bbox({ type: "FeatureCollection", features: f }), padding: 80 } };`',
            ),
        label: z.string().optional().describe('Short label for the new entry (default: "processed (<N> places)").'),
        entryId: placesEntryIdHintSchema,
        show: z
            .object({
                places: showPlacesSchema
                    .optional()
                    .describe('Render the processed places (markerType / zoomMode / hidePreviousEntries).'),
                geometries: showProducedGeometriesSchema
                    .optional()
                    .describe('Render the polygons returned in `geometries`. No-op when none were produced.'),
            })
            .optional()
            .describe(
                '`show.places` draws the processed places; `show.geometries` draws produced polygons; combine freely. ' +
                    'For derived results that supersede their inputs (filter/refine/subset), set ' +
                    '`show.places.hidePreviousEntries: "all"` (or the source `placesEntryIDs`) so only the final entry is visible. ' +
                    'Omit to store without rendering.',
            ),
        connectMarkerType: z
            .enum(['pin', 'base-map'])
            .optional()
            .describe(
                'Which PlacesModule renders `placeConnections`. Default: "pin". ' +
                    'Match the module holding the endpoints — ids only resolve against currently-shown places.',
            ),
        withGeometries: z
            .boolean()
            .optional()
            .describe(
                "Pre-fetch each input place's boundary polygon and pass it as the `geometries` arg. " +
                    'Required when the code reads `geometries` (aggregate footprints, h3 coverage, buffer outlines). Default: false.',
            ),
    });

/** Default-flag (`experimentalSearch: false`) tool schema. */
export const processPlacesSchema = buildProcessPlacesSchema({});

export const processPlacesDescription =
    'Dynamic JS over place entries: filter/merge/subset/re-order, draw connections (pairings, stars, nearest-neighbour graphs), ' +
    'compute polygons (union, buffer, h3 coverage), and/or fit the camera. ' +
    'Code `(places, placesByEntry, geometries, h3, turf) => { places?, placeConnections?, geometries?, fitOnMap? }`. ' +
    'Sources untouched; `places` writes a NEW entry (rendered via `show.places` / `show.geometries` / `connectMarkerType`); ' +
    '`fitOnMap`-only skips state. ' +
    'For derived results that supersede inputs, set `show.places.hidePreviousEntries: "all"` so only the new entry is visible. ' +
    'Set `withGeometries: true` to pre-fetch boundary polygons.';

type ProcessResult = {
    places?: Places;
    placeConnections?: PlaceConnectionDisplay[];
    geometries?: PolygonFeature<CommonPlaceProps>[];
    fitOnMap?: FitOnMapInput;
};

const isPlacesCollection = (value: unknown): value is Places => {
    if (!value || typeof value !== 'object') return false;
    const v = value as { type?: unknown; features?: unknown };
    return v.type === 'FeatureCollection' && Array.isArray(v.features);
};

const isConnectionArray = (value: unknown): value is PlaceConnectionDisplay[] => {
    if (!Array.isArray(value)) return false;
    const isEndpoint = (endpoint: unknown): boolean =>
        typeof endpoint === 'string' || (typeof endpoint === 'object' && endpoint !== null && 'geometry' in endpoint);
    return value.every((item) => {
        if (!item || typeof item !== 'object') return false;
        const connection = item as { from?: unknown; to?: unknown };
        return isEndpoint(connection.from) && isEndpoint(connection.to);
    });
};

const isGeometryArray = (value: unknown): value is PolygonFeature<CommonPlaceProps>[] =>
    Array.isArray(value) && value.every((v) => isPolygonFeature<CommonPlaceProps>(v));

const isProcessResult = (value: unknown): value is ProcessResult => {
    if (!value || typeof value !== 'object') return false;
    const v = value as { places?: unknown; placeConnections?: unknown; geometries?: unknown; fitOnMap?: unknown };
    if (v.places !== undefined && !isPlacesCollection(v.places)) return false;
    if (v.placeConnections !== undefined && !isConnectionArray(v.placeConnections)) return false;
    if (v.geometries !== undefined && !isGeometryArray(v.geometries)) return false;
    if (v.fitOnMap !== undefined && !isFitOnMapInput(v.fitOnMap)) return false;
    // Need at least one effect — either write a new entry (`places`) or move the camera (`fitOnMap`).
    if (v.places === undefined && v.fitOnMap === undefined) return false;
    // `placeConnections` and `geometries` hang off the produced entry; without `places` there is no entry.
    return !(v.places === undefined && (v.placeConnections !== undefined || v.geometries !== undefined));
};

const runProcessCode = async (
    code: string,
    places: Places,
    placesByEntry: Record<string, Places>,
    geometries: PolygonFeature<CommonPlaceProps>[],
): Promise<ProcessResult | { error: string }> => {
    const sandboxResult = await runSandboxedFn(
        code,
        ['places', 'placesByEntry', 'geometries', 'h3', 'turf'],
        [places, placesByEntry, geometries, h3, turf],
        'Process',
    );
    if ('error' in sandboxResult) return { error: sandboxResult.error };
    if (!isProcessResult(sandboxResult.value)) {
        return {
            error:
                'Process code must return `{ places?, placeConnections?, geometries?, fitOnMap? }`. At least one ' +
                'of `places`/`fitOnMap` required; `placeConnections` and `geometries` require `places`. ' +
                'Geometries must be Polygon or MultiPolygon GeoJSON Features. ' +
                '`fitOnMap`: `[W,S,E,N]` or `{ bbox: [W,S,E,N], padding?, animate? }`.',
        };
    }
    return sandboxResult.value;
};

const renderConnections = async (
    entryId: string,
    connections: PlaceConnectionDisplay[],
    state: ToolState,
    markerType: 'pin' | 'base-map',
): Promise<number | { error: string }> => {
    try {
        // Connections render on the new entry's PlacesModule for the chosen
        // marker theme — same module that draws the entry's pins, so the
        // lines snap to the rendered features.
        const placesModule = await state.places.getEntryPlacesModule(entryId, markerType);
        await placesModule.showConnections(connections);
        return connections.length;
    } catch (error) {
        return { error: `Failed to render connections: ${error instanceof Error ? error.message : String(error)}` };
    }
};

/**
 * Build the process-places executor for a given {@link FeatureFlags} bag.
 * `flags` controls whether the place summaries returned to the LLM include the
 * experimental `areaId` / `areaCountry` / `areaTags` fields.
 */
export const buildExecuteProcessPlaces =
    (flags: FeatureFlags) =>
    async (
        params: z.infer<ReturnType<typeof buildProcessPlacesSchema>>,
        state: ToolState,
    ): Promise<z.infer<ReturnType<typeof buildProcessPlacesOutputSchema>>> => {
        const { placesEntryIDs, code, label, show, connectMarkerType, entryId, withGeometries } = params;

        const sourceEntries = placesEntryIDs?.length
            ? placesEntryIDs.map((id) => state.places.entries.find((entry) => entry.id === id))
            : [state.places.entries.at(-1)];

        for (let i = 0; i < sourceEntries.length; i++) {
            if (!sourceEntries[i]) {
                const requestedId = placesEntryIDs?.[i];
                return {
                    error: requestedId
                        ? `No entry found with id "${requestedId}". Use recallPlaces to list available IDs.`
                        : 'No places entries available to process. Run discoverPlaces first.',
                };
            }
        }
        const resolvedEntries = sourceEntries as NonNullable<(typeof sourceEntries)[number]>[];

        const inputPlaces: Places = {
            type: 'FeatureCollection',
            features: resolvedEntries.flatMap((entry) => entry.places),
        } as Places;

        // Per-entry view so set ops between entries (diff, intersection,
        // group-by-source) don't require leaving the sandbox to call
        // `recallPlaces`. The merged `places` collection is still the convenient
        // default; `placesByEntry[id]` is the escape hatch when the LLM needs
        // to keep entries distinct.
        const placesByEntry: Record<string, Places> = Object.fromEntries(
            resolvedEntries.map((entry) => [entry.id, { type: 'FeatureCollection', features: entry.places } as Places]),
        );

        // Pre-fetch geometries for every input entry when the caller opts in. Each
        // entry caches its own polygons via `fetchGeometriesForEntry`, so repeat
        // calls on the same entry are free; we then merge across entries to feed
        // the sandbox a single `geometries` array (matching `process-geometries`).
        let inputGeometries: PolygonFeature<CommonPlaceProps>[] = [];
        if (withGeometries) {
            try {
                const perEntry = await Promise.all(
                    resolvedEntries.map((entry) => state.places.fetchGeometriesForEntry(entry.id)),
                );
                inputGeometries = perEntry.flat();
            } catch (error) {
                return {
                    error: `Failed to fetch input geometries: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        }

        const runResult = await runProcessCode(code, inputPlaces, placesByEntry, inputGeometries);
        if ('error' in runResult) return runResult;
        const { places: processed, placeConnections, geometries: producedGeometries, fitOnMap } = runResult;

        // Fit-only path: the LLM only wants to focus the camera on a computed bbox — no entry written,
        // no rendering, no connections. Validator guarantees `fitOnMap` is set in this branch.
        if (!processed) {
            return { fitted: applyFitOnMap(state, fitOnMap!) };
        }

        const count = processed.features.length;
        const entryLabel = `${label ? `processed: ${label}` : 'processed'} (${count} ${count === 1 ? 'place' : 'places'})`;
        // When the LLM supplies a semantic `entryId`, use it directly — addPlaceResult enforces uniqueness
        // by suffixing on collision. Otherwise fall back to the source-derived `<sources>-process-N` id.
        let derivedId: string;
        if (entryId) {
            derivedId = entryId;
        } else {
            const sourceIds = resolvedEntries.map((entry) => entry.id);
            const prefix = `${sourceIds.join('+')}-process-`;
            const existingCount = state.places.entries.filter((entry) => entry.id.startsWith(prefix)).length;
            derivedId = `${prefix}${existingCount}`;
        }
        const newPlacesEntryId = state.places.addPlaceResult(
            processed,
            entryLabel,
            derivedId,
            placeConnections,
            producedGeometries,
        );

        // Render places and/or geometries based on the nested `show` knobs. Either,
        // both, or neither may be set; building `shown` field-by-field keeps it
        // truthful (we don't claim to have rendered something the caller didn't
        // ask for).
        const shown: z.infer<typeof shownReportSchema> = {};
        if (show?.places) {
            shown.places = await showResultsOnMap(state, [newPlacesEntryId], show.places);
        }
        if (show?.geometries && producedGeometries?.length) {
            const theme = show.geometries.theme ?? 'outline';
            const mode = show.geometries.mode ?? 'replace';
            // Per-entry geometries module — anchored to the new entry so it
            // doesn't reuse a sibling entry's GeometriesModule.
            await state.places.showPlaceGeometries(producedGeometries, theme, mode, newPlacesEntryId);
            shown.geometries = { count: producedGeometries.length, theme, mode };
        }
        const reportShown = shown.places || shown.geometries ? shown : undefined;
        const storedLabel = state.places.entries.find((entry) => entry.id === newPlacesEntryId)?.label;

        let connectionsRendered: number | undefined;
        if (placeConnections) {
            const rendered = await renderConnections(
                newPlacesEntryId,
                placeConnections,
                state,
                connectMarkerType ?? 'pin',
            );
            if (typeof rendered === 'object') return rendered;
            connectionsRendered = rendered;
        }

        // Apply `fitOnMap` last so it overrides any `show.places` zoom that ran via `showResultsOnMap`.
        const fitted = fitOnMap ? applyFitOnMap(state, fitOnMap) : undefined;

        return {
            ...summarizePlaces(processed, flags),
            placesEntryId: newPlacesEntryId,
            ...(storedLabel && { label: storedLabel }),
            ...(reportShown && { shown: reportShown }),
            ...(connectionsRendered !== undefined && { connectionsRendered }),
            ...(producedGeometries?.length && { geometryCount: producedGeometries.length }),
            ...(fitted && { fitted }),
        };
    };

/** Default-flag (`experimentalSearch: false`) executor for process-places. */
export const executeProcessPlaces = buildExecuteProcessPlaces({});

/**
 * Build a complete {@link ToolEntry} for `processPlaces` for the given
 * {@link FeatureFlags}. Schema, output schema, and executor are all picked
 * from the same flag set so they agree.
 */
export const buildProcessPlacesEntry = <S extends ToolState = ToolState>(
    flags: FeatureFlags,
    metadata: Omit<ToolEntry<S>, 'description' | 'inputSchema' | 'outputSchema' | 'execute'>,
): ToolEntry<S> => ({
    ...metadata,
    description: processPlacesDescription,
    inputSchema: buildProcessPlacesSchema(flags),
    outputSchema: buildProcessPlacesOutputSchema(flags),
    execute: buildExecuteProcessPlaces(flags) as ToolEntry<S>['execute'],
});

// Static metadata for the processPlaces tool — the registry binds this to the schema/executor.
// Kept colocated with the tool so all tool config (description/schema/executor/metadata) shares
// a single source of truth.
const processPlacesMetadata = {
    classificationPrompt:
        'Run dynamic JS over existing places to filter/merge/subset/re-order and/or compute connections between them. Code returns `{ places, placeConnections? }`.',
    tags: ['place', 'location', 'discover', 'connections'],
    examples: [
        'processPlaces({ placesEntryIDs: ["places-2"], code: "return { places: { type: \'FeatureCollection\', features: places.features.filter(p => (p.properties.poi?.name ?? \'\').toLowerCase().includes(\'vegan\')) } };", label: "vegan only" })',
        'processPlaces({ placesEntryIDs: ["places-1"], code: "const [hub, ...rest] = places.features; return { places, placeConnections: rest.map(p => ({ from: hub, to: p })) };" })',
        'processPlaces({ placesEntryIDs: ["places-1"], code: "const f = places.features.filter(p => p.properties.poi?.categories?.includes(\'CAFE\')); return { places: { type: \'FeatureCollection\', features: f }, placeConnections: f.slice(1).map(p => ({ from: f[0], to: p })) };", show: { markerType: "pin", zoomMode: "auto" } })',
    ],
    examplePrompts: [
        'Keep only the vegan restaurants from the last search',
        'Merge these two entries and drop non-POIs',
        'Show these places in relation to each other',
        'Draw lines from the charging station to every nearby cafe',
        'Connect each hotel to its closest restaurant',
        'Link every place in this set to the map center',
    ],
    relatedTools: ['discoverPlaces', 'recallPlaces', 'analysePlaces', 'updatePlacesDisplay'],
    dependsOn: ['discoverPlaces', 'recallPlaces'],
} satisfies Omit<ToolEntry, 'description' | 'inputSchema' | 'outputSchema' | 'execute'>;

/**
 * Builder for the processPlaces default tool entry. Reads {@link FeatureFlags}
 * from the build options so schema and executor stay aligned.
 */
export const processPlacesBuilder: ToolEntryBuilder = (options) =>
    buildProcessPlacesEntry(options.featureFlags ?? {}, processPlacesMetadata);
