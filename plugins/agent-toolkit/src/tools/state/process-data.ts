/**
 * @module agent-toolkit-tools
 *
 * Sandbox-running processing tool. Counterpart to `analyseData`: accepts any
 * combination of places / routes / incidents / customGeometries /
 * trafficAreaAnalytics / byod entries as inputs and produces a NEW places entry,
 * a NEW custom-geometries entry, a NEW BYOD entry, a camera fit, or any
 * combination of those, from a single sandbox run.
 *
 * Output disambiguation:
 * • `places` returned → writes a NEW places entry; `placeConnections` and
 *   inline `geometries` (when also present) are attached to that entry.
 * • `geometries` returned without `places` → writes a NEW custom-geometries entry.
 * • `byod` returned alone → writes a NEW BYOD entry.
 * • `fitOnMap` alone → camera move only (no entry written).
 *
 * **Scope + enablement.** Shared scaffolding in `tools/shared/entry-kinds.ts` builds
 * the per-kind input fields, the per-kind sandbox / schema docs, the scope schema and
 * the "at least one of …" message. This file only adds the tool-specific surface:
 * the return-shape preamble, `routeUtils`, fit-on-map / show / connectMarkerType /
 * label / entryId / operation, the description, the result validator and the executor.
 */

import {
    bboxFromGeoJSON,
    type CommonPlaceProps,
    calculateProgressAtRoutePoint,
    getCoordinateAtRouteProgress,
    getProgressAtNearestRoutePoint,
    getRouteProgressBetween,
    getRouteProgressForSection,
    getSectionBBox,
    type Places,
    type PolygonFeature,
} from '@tomtom-org/maps-sdk/core';
import type { PlaceConnectionDisplay } from '@tomtom-org/maps-sdk/map';
import * as turf from '@turf/turf';
import type { FeatureCollection as GeoJSONFeatureCollection, GeoJsonProperties } from 'geojson';
import * as h3 from 'h3-js';
import { z } from 'zod';
import type { EntryDataKind, ToolBuildOptions, ToolEntryBuilder, ToolState } from '../../types';
import { summarizePlaces } from '../../utils';
import {
    ALL_ENTRY_DATA_KINDS,
    applyFitOnMap,
    buildAtLeastOneEntryIdMessage,
    buildEntryFieldList,
    buildEntryIdFields,
    buildEntryKindSandboxDocs,
    buildEntryKindSchemaDocs,
    buildEntryKindScopeSchema,
    buildSandboxCodePrompt,
    CROSS_KIND_OPS_DOC,
    type EntryKindScope,
    FIT_ON_MAP_DOC,
    type FitOnMapInput,
    fittedReportSchema,
    GEOMETRIES_PROPS_DOC,
    GEOMETRIES_SKIPPED_DESC,
    GEOMETRIES_SOURCE_IDS_DESC,
    type GeometriesId,
    type GeometriesMeta,
    geometriesIdSchema,
    hasAnyEntryIds,
    hidePreviousEntriesSchema,
    hidePreviousShownEntries,
    isFitOnMapInput,
    isPolygonFeature,
    MULTI_INPUT_SANDBOX_PARAMS,
    packSandboxArgs,
    placesEntryIdHintSchema,
    prepareMultiInputs,
    resolveActiveKinds,
    runSandboxedFn,
    showModeSchema,
    showPlacesSchema,
    showResultsOnMap,
    skippedSourceSchema,
} from '../shared';
import { buildPlacesOutputSchema, toolErrorSchema } from '../shared-output-schemas';

/**
 * Per-turn scope kinds that `processData` understands. Identical to {@link EntryDataKind}.
 *
 * @group Agent Toolkit
 */
export type ProcessDataKind = EntryDataKind;

/**
 * Per-turn scope for `processData`. Emitted by the classifier in `toolScopes.processData`
 * when only a subset of input kinds is relevant.
 *
 * @group Agent Toolkit
 */
export type ProcessDataScope = EntryKindScope;

/**
 * Default scope schema for processData — accepts every {@link EntryDataKind}. When the
 * agent narrows the enabled kinds via `createMapAgent`'s `dataEntries`, the builder
 * produces a narrower schema in {@link buildProcessDataEntry}.
 */
export const processDataScopeSchema = buildEntryKindScopeSchema(ALL_ENTRY_DATA_KINDS);

// `routeUtils` namespace — same set processRoutes injects, reused here so any
// routes input can be sliced by section/progress without re-implementing it.
const routeUtils = {
    bboxFromGeoJSON,
    calculateProgressAtRoutePoint,
    getCoordinateAtRouteProgress,
    getProgressAtNearestRoutePoint,
    getRouteProgressBetween,
    getRouteProgressForSection,
    getSectionBBox,
} as const;

const ROUTE_UTILS_DOC =
    '`routeUtils` (from @tomtom-org/maps-sdk/core, only useful when `routesEntryIDs` is set):\n' +
    '• `getSectionBBox(route, section)` → `[W,S,E,N]`. Sections at `route.properties.sections.<type>`.\n' +
    '• `getRouteProgressForSection(route, section)` / `getRouteProgressBetween(route, startIdx, endIdx)`.\n' +
    '• `calculateProgressAtRoutePoint(route, pathIndex)`.\n' +
    '• `getCoordinateAtRouteProgress(route, query)` — `query`: `{ traveledDistanceInMeters }` | `{ traveledTimeInSeconds }` | `{ clockTime: Date }`.\n' +
    '• `getProgressAtNearestRoutePoint(route, { lng, lat })` — snap a point to the line.\n' +
    '• `bboxFromGeoJSON(featureOrCollection)`.';

const PROCESS_DATA_SANDBOX_PARAMS = [...MULTI_INPUT_SANDBOX_PARAMS, 'routeUtils'] as const;

const showProducedGeometriesSchema = z.object({
    theme: z
        .enum(['filled', 'outline', 'inverted'])
        .optional()
        .describe('Visual theme. Default: "outline". Use "inverted" for difference/inverse results.'),
    mode: showModeSchema,
    hidePreviousEntries: hidePreviousEntriesSchema('custom-geometries').optional(),
});

const sharedProcessDataReport = {
    sourceIds: z
        .array(geometriesIdSchema)
        .optional()
        .describe(`${GEOMETRIES_SOURCE_IDS_DESC} (only when \`geometriesEntryIDs\` was set).`),
    skipped: z.array(skippedSourceSchema).optional().describe(GEOMETRIES_SKIPPED_DESC),
    fitted: fittedReportSchema.optional(),
} as const;

/** Output schema for process-data. */
export const processDataOutputSchema = z.union([
    // Places branch: code returned `places`. Attached connections + polygons go on the new entry.
    buildPlacesOutputSchema({}).extend({
        placesEntryId: z.string(),
        label: z.string().optional(),
        connectionsRendered: z.number().optional(),
        placesGeometryCount: z
            .number()
            .optional()
            .describe('Polygons attached to the new places entry (when `geometries` was returned alongside).'),
        shownPlaces: z.boolean().optional(),
        ...sharedProcessDataReport,
    }),
    // Custom-geometries branch: code returned `geometries` WITHOUT `places`.
    z.object({
        customGeometriesEntryId: geometriesIdSchema,
        customGeometriesCount: z.number(),
        label: z.string(),
        operation: z.string().optional(),
        shownCustomGeometries: z.boolean().optional(),
        ...sharedProcessDataReport,
    }),
    // BYOD branch: code returned `byod` WITHOUT `places`/`geometries`. Writes a new BYOD entry.
    z.object({
        byodEntryId: z.string(),
        byodFeatureCount: z.number(),
        label: z.string(),
        fitted: fittedReportSchema.optional(),
    }),
    // Fit-only branch: code returned `fitOnMap` alone.
    z.object({ fitted: fittedReportSchema }),
    toolErrorSchema,
]);

/** Build the scope-aware `code` field description for process-data. */
export const buildProcessDataCodeDoc = (
    enabled: readonly EntryDataKind[],
    scope: ProcessDataScope | undefined,
): string => {
    const active = resolveActiveKinds(enabled, scope);
    // Deep per-kind schema docs only appear once the classifier has committed to specific
    // kinds. The unscoped path stays terse (terse one-line field hints already live in the
    // input-field describes; the code-doc just needs the operational reference).
    const schemaBlocks = scope ? buildEntryKindSchemaDocs(active) : '';
    const showCrossKind = !!scope && active.length > 1;
    const showTrafficNote = !!scope && active.includes('trafficAreaAnalytics');
    const trafficNote = showTrafficNote
        ? '`trafficAreaAnalytics` is a FeatureCollection of tile/hex regions whose `feature.properties` carry metric ' +
          'fields (`congestionLevel`, `speed`, `freeFlowSpeed`, `travelTime`, `networkLength`); use ' +
          '`turf.booleanPointInPolygon` / `turf.lineIntersect` to bridge with places/routes.\n\n'
        : '';
    const routeUtilsDoc = !!scope && active.includes('routes') ? `${ROUTE_UTILS_DOC}\n\n` : '';
    const geometriesProps = !!scope && active.includes('customGeometries') ? `${GEOMETRIES_PROPS_DOC}\n\n` : '';
    const byodOutputLine = active.includes('byod')
        ? '• `byod: FeatureCollection` — writes a NEW BYOD entry (any GeoJSON: Point/Line/Polygon/mixed). Use for ' +
          'derived BYOD layers (e.g. cleaned/filtered customer data).\n'
        : '';
    // Per-kind sandbox-doc one-liners — only when scope commits to specific kinds (matches
    // analyseData's gating; otherwise the input-field describes already carry enough info).
    const sandboxList = scope ? `${buildEntryKindSandboxDocs(active)}\n` : '';
    return (
        'Async JS returning `{ places?, placeConnections?, geometries?, fitOnMap?, byod? }`. At least one of ' +
        '`places` / `geometries` / `fitOnMap` / `byod` must be present. ' +
        '`places` (with optional attached `geometries`), standalone `geometries`, and `byod` are MUTUALLY ' +
        'EXCLUSIVE — only one is written per call, others are dropped. `fitOnMap` composes with any of them.\n\n' +
        '• `places: Places` — writes a NEW places entry. Filters/merges/subsets of `places.features`, or computed point ' +
        'features (must conform to the Place schema).\n' +
        '• `placeConnections: { from, to, id? }[]` — lines between output places (endpoints: Place or place id). ' +
        "Requires `places`. Drawn on the new entry's PlacesModule.\n" +
        '• `geometries: PolygonFeature[]` — polygons (Polygon/MultiPolygon, stable `id` recommended). ' +
        'When `places` is also present, attached to the new places entry; when `places` is absent, written as a NEW ' +
        'custom-geometries entry.\n' +
        '• `fitOnMap` — bbox or `{ bbox, padding?, animate? }`. Camera move; when alone, no entry written.\n' +
        byodOutputLine +
        '\n' +
        `${buildSandboxCodePrompt(PROCESS_DATA_SANDBOX_PARAMS)}\n\n` +
        sandboxList +
        'Each input is `undefined` when its `*EntryIDs` argument was omitted — guard before reading. ' +
        trafficNote +
        (showCrossKind ? `${CROSS_KIND_OPS_DOC}\n\n` : '') +
        routeUtilsDoc +
        `${FIT_ON_MAP_DOC}\n\n` +
        geometriesProps +
        schemaBlocks
    );
};

/** Build the scope-aware processData input schema. */
export const buildProcessDataSchema = (enabled: readonly EntryDataKind[], scope: ProcessDataScope | undefined) => {
    const active = resolveActiveKinds(enabled, scope);
    const requiredHint = `At least one of ${buildEntryFieldList(active)} is REQUIRED.`;
    const shape: Record<string, z.ZodTypeAny> = {
        ...buildEntryIdFields(active, { verb: 'process', requiredHint }),
    };

    shape.code = z.string().describe(buildProcessDataCodeDoc(enabled, scope));
    shape.label = z
        .string()
        .optional()
        .describe('Short label for the new entry (used by both places and custom-geometries paths).');
    shape.entryId = placesEntryIdHintSchema;
    shape.operation = z
        .string()
        .optional()
        .describe(
            'Short operation label (`union`, `buffer`, `difference`, `h3-coverage`, …) stored as provenance ' +
                'on a new custom-geometries entry. Ignored on the places path.',
        );
    // `show` sub-fields are conditional on the corresponding kind being writable on the active
    // set: `places` write is possible whenever the code returns places (always allowed —
    // returning `places` is a sandbox concern, not a *EntryIDs concern); same for
    // `customGeometries`. We keep all three sub-fields exposed so the LLM can return any
    // supported kind without a scope twist. The executor only consults the matching field.
    shape.show = z
        .object({
            places: showPlacesSchema.optional().describe('Render the new places entry (when `places` was returned).'),
            placesGeometries: z
                .object({
                    theme: z.enum(['filled', 'outline', 'inverted']).optional(),
                    mode: showModeSchema,
                })
                .optional()
                .describe(
                    'Render the polygons attached to the new places entry (when both `places` and `geometries` were returned).',
                ),
            customGeometries: showProducedGeometriesSchema
                .optional()
                .describe('Render the new custom-geometries entry (when `geometries` was returned WITHOUT `places`).'),
        })
        .optional()
        .describe(
            'Optional per-output render knobs. The executor only consults the field matching what the code returned ' +
                '(so leaving e.g. `customGeometries` set when `places` was returned is a silent no-op).',
        );
    shape.connectMarkerType = z
        .enum(['pin', 'base-map'])
        .optional()
        .describe(
            'Which PlacesModule renders `placeConnections`. Default: "pin". Match the module holding the endpoints.',
        );

    return z.object(shape).refine(hasAnyEntryIds, { message: buildAtLeastOneEntryIdMessage(active) });
};

/** Default full-surface input schema for process-data — every kind enabled, no per-turn scope. */
export const processDataSchema = buildProcessDataSchema(ALL_ENTRY_DATA_KINDS, undefined);

/** Build the scope-aware processData tool description. */
export const buildProcessDataDescription = (
    enabled: readonly EntryDataKind[],
    scope: ProcessDataScope | undefined,
): string => {
    const active = resolveActiveKinds(enabled, scope);
    const kindList = active.join(' / ');
    const contrast =
        'CONTRAST `analyseData`, which attaches JSON/chart metadata to existing entries and never renders.';
    if (scope) {
        return (
            `Run dynamic JS over ${kindList} entries to produce NEW renderable map data — a places, ` +
            'custom-geometries, or BYOD entry (with optional `placeConnections` / attached polygon footprints), ' +
            `and/or a \`fitOnMap\` camera move. ${contrast} Returns ` +
            '`{ places?, placeConnections?, geometries?, fitOnMap?, byod? }`: when `places` is returned, inline ' +
            '`geometries` attach to it; otherwise they become a standalone custom-geometries entry. Inputs are ' +
            '`undefined` when their `*EntryIDs` argument is omitted — guard before reading.'
        );
    }
    return (
        `Run dynamic JS over any combination of ${kindList} entries to produce NEW renderable map data — a places, ` +
        'custom-geometries, or BYOD entry (with optional `placeConnections` / attached polygon footprints), ' +
        `and/or a \`fitOnMap\` camera move. ${contrast} Returns ` +
        '`{ places?, placeConnections?, geometries?, fitOnMap?, byod? }`: when `places` is returned, inline ' +
        '`geometries` attach to it as place footprints; otherwise they become a standalone custom-geometries entry. ' +
        '`routeUtils` is exposed alongside `h3` / `turf` for route section / progress work. Inputs are `undefined` ' +
        'when their `*EntryIDs` argument is omitted — guard before reading.'
    );
};

/** Default full-surface description — every kind enabled. */
export const processDataDescription = buildProcessDataDescription(ALL_ENTRY_DATA_KINDS, undefined);

const buildProcessDataScopePrompt = (enabled: readonly EntryDataKind[]): string => {
    const list = enabled.map((k) => `"${k}"`).join(' | ');
    return (
        `Emit \`{ kinds: [${list}] }\` ` +
        'listing only the entry kinds the user query touches. Omit when truly cross-kind.'
    );
};

type ProcessResult = {
    places?: Places;
    placeConnections?: PlaceConnectionDisplay[];
    geometries?: PolygonFeature[];
    fitOnMap?: FitOnMapInput;
    byod?: GeoJSONFeatureCollection;
};

// Both BYOD and Places outputs are FeatureCollections with no further per-feature checks at this
// layer — keep one shape check and let the call site choose the narrow it wants.
const isFeatureCollectionLike = <T>(value: unknown): value is T => {
    if (!value || typeof value !== 'object') return false;
    const candidate = value as { type?: unknown; features?: unknown };
    return candidate.type === 'FeatureCollection' && Array.isArray(candidate.features);
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

// Walk the raw `geometries` value, narrow it to `PolygonFeature[]` with a pinpointed
// error message on the first bad element. Splitting validation out keeps the type
// predicate flowing into the returned `ProcessResult` without any `as` casts.
const validateGeometries = (raw: unknown): { value: PolygonFeature[] } | { error: string } => {
    if (!Array.isArray(raw)) {
        return { error: '`geometries` must be an array of GeoJSON Polygon/MultiPolygon Features.' };
    }
    const validated: PolygonFeature[] = [];
    for (let i = 0; i < raw.length; i++) {
        const item = raw[i];
        // Generic-explicit so the narrowed `item` matches `PolygonFeature`'s default `GeoJsonProperties`
        // (otherwise the predicate's `<P = unknown>` default leaks `PolygonFeature<unknown>` here).
        if (!isPolygonFeature<GeoJsonProperties>(item)) {
            return { error: `\`geometries[${i}]\` must be a GeoJSON Feature with Polygon or MultiPolygon geometry.` };
        }
        validated.push(item);
    }
    return { value: validated };
};

// `validateField` collapses the "either the optional field is missing OR it passes the shape check"
// pattern into one helper, so `validateProcessOutput` stays under the per-function cognitive
// complexity cap (each per-field block was a nested `if` previously). Returning `value: undefined`
// for an absent field lets callers assign unconditionally.
const validateField = <T>(
    raw: unknown,
    check: (value: unknown) => value is T,
    errorMessage: string,
): { value: T | undefined } | { error: string } => {
    if (raw === undefined) return { value: undefined };
    if (!check(raw)) return { error: errorMessage };
    return { value: raw };
};

// Treat an empty FeatureCollection as "no content produced". Write sites downstream use truthy
// checks (`if (processed)` / `if (producedByod)`), and the joint-constraint check below counts
// fields as "set" by `!== undefined`. Without this normalisation, returning `{ features: [] }`
// would slip past both — writing an empty places/byod entry while a non-empty geometries / byod
// return on the same call gets silently dropped (single-write-per-call semantics).
const nonEmptyFeatureCollection = <T extends { features: readonly unknown[] }>(fc: T | undefined): T | undefined =>
    fc && fc.features.length > 0 ? fc : undefined;

// Joint-shape rule: at least one writable output must be present, and placeConnections may only
// accompany places. Split out so `validateProcessOutput`'s per-field validations stay flat.
const checkProcessJointConstraints = (result: ProcessResult): string | undefined => {
    const noOutput =
        result.places === undefined &&
        result.geometries === undefined &&
        result.fitOnMap === undefined &&
        result.byod === undefined;
    if (noOutput) {
        return 'At least one of `places`, `geometries`, `fitOnMap`, `byod` must produce content (empty arrays / FeatureCollections do not count).';
    }
    if (result.places === undefined && result.placeConnections !== undefined) {
        return '`placeConnections` requires `places` to be returned alongside.';
    }
    return undefined;
};

const validateProcessOutput = (raw: unknown): ProcessResult | string => {
    if (!raw || typeof raw !== 'object') {
        return 'Process code must return `{ places?, placeConnections?, geometries?, fitOnMap?, byod? }`.';
    }
    const candidate = raw as {
        places?: unknown;
        placeConnections?: unknown;
        geometries?: unknown;
        fitOnMap?: unknown;
        byod?: unknown;
    };

    const result: ProcessResult = {};

    const places = validateField<Places>(
        candidate.places,
        isFeatureCollectionLike<Places>,
        '`places` must be a `Places` FeatureCollection of Point features.',
    );
    if ('error' in places) return places.error;
    result.places = nonEmptyFeatureCollection(places.value);

    const placeConnections = validateField(
        candidate.placeConnections,
        isConnectionArray,
        '`placeConnections` must be an array of `{ from, to, id? }` (endpoints: Place or place id).',
    );
    if ('error' in placeConnections) return placeConnections.error;
    result.placeConnections = placeConnections.value;

    if (candidate.geometries !== undefined) {
        const validated = validateGeometries(candidate.geometries);
        if ('error' in validated) return validated.error;
        // Empty array drops to undefined for the same reason as `nonEmptyFeatureCollection` above —
        // joint-constraint + downstream truthy checks treat absent and empty consistently.
        result.geometries = validated.value.length > 0 ? validated.value : undefined;
    }

    const fitOnMap = validateField(
        candidate.fitOnMap,
        isFitOnMapInput,
        '`fitOnMap` must be `[W,S,E,N]` or `{ bbox: [W,S,E,N], padding?, animate? }`.',
    );
    if ('error' in fitOnMap) return fitOnMap.error;
    result.fitOnMap = fitOnMap.value;

    const byod = validateField<GeoJSONFeatureCollection>(
        candidate.byod,
        isFeatureCollectionLike<GeoJSONFeatureCollection>,
        '`byod` must be a GeoJSON FeatureCollection (any geometry types).',
    );
    if ('error' in byod) return byod.error;
    result.byod = nonEmptyFeatureCollection(byod.value);

    const jointError = checkProcessJointConstraints(result);
    return jointError ?? result;
};

type ProcessDataInput = {
    placesEntryIDs?: string[];
    routesEntryIDs?: string[];
    incidentsEntryIDs?: string[];
    geometriesEntryIDs?: GeometriesId[];
    trafficAreaAnalyticsEntryIDs?: string[];
    byodEntryIDs?: string[];
    code: string;
    label?: string;
    entryId?: string;
    operation?: string;
    show?: {
        places?: z.infer<typeof showPlacesSchema>;
        placesGeometries?: { theme?: 'filled' | 'outline' | 'inverted'; mode?: 'add' | 'replace' };
        customGeometries?: z.infer<typeof showProducedGeometriesSchema>;
    };
    connectMarkerType?: 'pin' | 'base-map';
};

type ProcessOutput = z.infer<typeof processDataOutputSchema>;

// Write the BYOD branch's output. No places/geometries override — BYOD layers manage their own
// visibility via state.byod, so we just write the entry and optionally fit the camera.
const writeByodResult = async (
    state: ToolState,
    params: ProcessDataInput,
    producedByod: GeoJSONFeatureCollection,
    fitOnMap: FitOnMapInput | undefined,
): Promise<ProcessOutput> => {
    const { label, entryId } = params;
    const byodLabel = label ? `processed: ${label}` : `processed byod (${producedByod.features.length})`;
    const newByodEntryId = await state.byod.addEntry(producedByod, byodLabel, {
        ...(entryId && { explicitId: entryId }),
    });
    const fitted = fitOnMap ? applyFitOnMap(state, fitOnMap) : undefined;
    return {
        byodEntryId: newByodEntryId,
        byodFeatureCount: producedByod.features.length,
        label: byodLabel,
        ...(fitted && { fitted }),
    };
};

// Optional connection rendering — pulled out so its try/catch + module-access doesn't bloat the
// places-path branch counter.
const renderConnections = async (
    state: ToolState,
    newPlacesEntryId: string,
    placeConnections: PlaceConnectionDisplay[],
    connectMarkerType: 'pin' | 'base-map' | undefined,
): Promise<{ count: number } | { error: string }> => {
    try {
        const placesModule = await state.places.getEntryPlacesModule(newPlacesEntryId, connectMarkerType ?? 'pin');
        await placesModule.showConnections(placeConnections);
        return { count: placeConnections.length };
    } catch (error) {
        return { error: `Failed to render connections: ${error instanceof Error ? error.message : String(error)}` };
    }
};

// Places branch — writes the entry, optionally renders it, attaches polygons / connections, and
// fits the camera. Returns the same shape as the executor's places branch did inline.
const writePlacesResult = async (
    state: ToolState,
    params: ProcessDataInput,
    validated: ProcessResult & { places: Places },
    geometriesMeta: GeometriesMeta,
): Promise<ProcessOutput> => {
    const { label, entryId, show, connectMarkerType, geometriesEntryIDs } = params;
    const { places: processed, placeConnections, geometries: producedGeometries, fitOnMap } = validated;

    const count = processed.features.length;
    const labelPrefix = label ? `processed: ${label}` : 'processed';
    const placeWord = count === 1 ? 'place' : 'places';
    const entryLabel = `${labelPrefix} (${count} ${placeWord})`;
    const newPlacesEntryId = await state.places.addPlaceResult(
        processed,
        entryLabel,
        entryId,
        placeConnections,
        producedGeometries as PolygonFeature<CommonPlaceProps>[] | undefined,
    );

    const shownPlaces = show?.places ? await showResultsOnMap(state, [newPlacesEntryId], show.places) : undefined;

    let placesGeometryCount: number | undefined;
    if (producedGeometries?.length) {
        placesGeometryCount = producedGeometries.length;
        if (show?.placesGeometries) {
            await state.places.showPlaceGeometries(
                producedGeometries as PolygonFeature<CommonPlaceProps>[],
                show.placesGeometries.theme ?? 'outline',
                show.placesGeometries.mode ?? 'replace',
                newPlacesEntryId,
            );
        }
    }

    let connectionsRendered: number | undefined;
    if (placeConnections) {
        const rendered = await renderConnections(state, newPlacesEntryId, placeConnections, connectMarkerType);
        if ('error' in rendered) return rendered;
        connectionsRendered = rendered.count;
    }

    const fitted = fitOnMap ? applyFitOnMap(state, fitOnMap) : undefined;
    const storedLabel = state.places.entries.find((entry) => entry.id === newPlacesEntryId)?.label;

    return {
        ...summarizePlaces(processed),
        placesEntryId: newPlacesEntryId,
        ...(storedLabel && { label: storedLabel }),
        ...(shownPlaces && { shownPlaces: true }),
        ...(connectionsRendered !== undefined && { connectionsRendered }),
        ...(placesGeometryCount !== undefined && { placesGeometryCount }),
        ...(geometriesEntryIDs && { sourceIds: geometriesMeta.sourceIds }),
        ...(geometriesMeta.skipped.length && { skipped: geometriesMeta.skipped }),
        ...(fitted && { fitted }),
    };
};

// Custom-geometries branch — writes a new entry from the produced polygons and optionally renders.
const writeCustomGeometriesResult = async (
    state: ToolState,
    params: ProcessDataInput,
    producedGeometries: PolygonFeature[],
    fitOnMap: FitOnMapInput | undefined,
    geometriesMeta: GeometriesMeta,
): Promise<ProcessOutput> => {
    const { label, entryId, operation, show, geometriesEntryIDs } = params;
    const customLabel = label ? `processed: ${label}` : `processed geometries (${producedGeometries.length})`;
    const newCustomEntryId = await state.customGeometries.addEntry(
        producedGeometries as PolygonFeature<CommonPlaceProps>[],
        { sourceIds: geometriesMeta.sourceIds, ...(operation && { operation }) },
        customLabel,
        entryId,
    );

    let shownCustomGeometries = false;
    if (show?.customGeometries) {
        await hidePreviousShownEntries(
            state.customGeometries,
            [newCustomEntryId],
            show.customGeometries.hidePreviousEntries,
        );
        await state.customGeometries.showEntry(
            newCustomEntryId,
            show.customGeometries.theme ?? 'outline',
            show.customGeometries.mode ?? 'replace',
        );
        shownCustomGeometries = true;
    }

    const fitted = fitOnMap ? applyFitOnMap(state, fitOnMap) : undefined;
    const customGeometriesEntryId: GeometriesId = { kind: 'customGeometries', id: newCustomEntryId };

    return {
        customGeometriesEntryId,
        customGeometriesCount: producedGeometries.length,
        label: customLabel,
        ...(operation && { operation }),
        ...(geometriesEntryIDs && { sourceIds: geometriesMeta.sourceIds }),
        ...(geometriesMeta.skipped.length && { skipped: geometriesMeta.skipped }),
        ...(shownCustomGeometries && { shownCustomGeometries: true }),
        ...(fitted && { fitted }),
    };
};

export const executeProcessData = async (params: ProcessDataInput, state: ToolState): Promise<ProcessOutput> => {
    const {
        placesEntryIDs,
        routesEntryIDs,
        incidentsEntryIDs,
        geometriesEntryIDs,
        trafficAreaAnalyticsEntryIDs,
        byodEntryIDs,
        code,
    } = params;

    const prepared = await prepareMultiInputs(
        {
            placesEntryIDs,
            routesEntryIDs,
            incidentsEntryIDs,
            geometriesEntryIDs,
            trafficAreaAnalyticsEntryIDs,
            byodEntryIDs,
        },
        state,
    );
    if ('error' in prepared) return { error: prepared.error };
    const { sandbox, geometries: geometriesMeta } = prepared.value;

    const sandboxResult = await runSandboxedFn(
        code,
        PROCESS_DATA_SANDBOX_PARAMS,
        [...packSandboxArgs(sandbox, { h3, turf }), routeUtils],
        'Process',
    );
    if ('error' in sandboxResult) return { error: sandboxResult.error };

    const validated = validateProcessOutput(sandboxResult.value);
    if (typeof validated === 'string') return { error: validated };
    const { places: processed, geometries: producedGeometries, fitOnMap, byod: producedByod } = validated;

    // Places + BYOD in the same return aren't supported — places path takes precedence when both
    // are present (BYOD is silently dropped to keep single-write-per-call semantics).
    if (processed) {
        return writePlacesResult(state, params, { ...validated, places: processed }, geometriesMeta);
    }
    if (producedGeometries?.length) {
        return writeCustomGeometriesResult(state, params, producedGeometries, fitOnMap, geometriesMeta);
    }
    if (producedByod) {
        return writeByodResult(state, params, producedByod, fitOnMap);
    }
    // Fit-only: no entry produced, just move the camera.
    if (fitOnMap) {
        return { fitted: applyFitOnMap(state, fitOnMap) };
    }
    return { error: 'Process code returned no `places`, `geometries`, `fitOnMap`, or `byod`.' };
};

/**
 * Scope-aware builder for the processData tool. Reads classifier-resolved `scope` AND the
 * agent's `enabledDataKinds` from {@link ToolBuildOptions} so disabled kinds disappear from
 * the description, schema, code-doc and classifier scope. The registry composes this with
 * static classifier metadata (tags / examples / related / depends / classificationPrompt)
 * so the registry remains the single source of truth for those fields.
 */
export const buildProcessDataEntry = (
    options: ToolBuildOptions<ProcessDataScope>,
    metadata: {
        classificationPrompt?: string;
        tags?: string[];
        examples?: string[];
        examplePrompts?: string[];
        relatedTools?: string[];
        dependsOn?: string[];
    },
) => {
    const enabled = options.enabledDataKinds ?? ALL_ENTRY_DATA_KINDS;
    return {
        description: buildProcessDataDescription(enabled, options.scope),
        inputSchema: buildProcessDataSchema(enabled, options.scope),
        outputSchema: processDataOutputSchema,
        execute: executeProcessData as (input: unknown, state: ToolState) => Promise<unknown>,
        scopeSchema: buildEntryKindScopeSchema(enabled),
        scopePrompt: buildProcessDataScopePrompt(enabled),
        ...metadata,
    };
};

/**
 * Builder for the `processData` default tool entry. Reads classifier-resolved scope and
 * the agent's enabled kinds from {@link ToolBuildOptions} and produces a narrowed entry;
 * without either, emits the full surface unchanged.
 */
export const processDataBuilder =
    (metadata: {
        classificationPrompt?: string;
        tags?: string[];
        examples?: string[];
        examplePrompts?: string[];
        relatedTools?: string[];
        dependsOn?: string[];
    }): ToolEntryBuilder<ToolState, ProcessDataScope> =>
    (options) =>
        buildProcessDataEntry(options, metadata);
