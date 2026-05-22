/**
 * @module agent-toolkit-tools
 *
 * Sandbox-running analysis tool. Accepts any combination of places / routes /
 * incidents / customGeometries / trafficAreaAnalytics / byod entries and exposes
 * them to user-authored JS as `places`, `routes`, `incidents`, `geometries`,
 * `trafficAreaAnalytics`, `byod` (and per-entry views), with `h3` and `turf`
 * available. The result is attached as `_analysis[name]` on every contributing
 * entry.
 *
 * Opt-in `monitor: { entryId }` registers the call as a recurring spec on the
 * targeted incidents entry — the code re-runs on every monitor-tick with
 * `previous` / `now` / `log` in scope. Constraint: only incidents-only inputs
 * are allowed when `monitor` is set (no cross-kind reruns in the lean merge).
 *
 * Opt-in `applyFocus` (default true when `monitor` is set) honours `focusIds`
 * on the result by calling `setFocus` on the source incidents entry.
 *
 * **Scope + enablement.** Shared scaffolding in `tools/shared/entry-kinds.ts` builds
 * the per-kind input fields, the "at least one of …" message, the per-kind sandbox /
 * schema docs, and the scope schema. This file only adds the tool-specific surface:
 * `name` / `description` / `outputFormat` / `monitor` / `applyFocus`, the code-doc
 * body (including the incidents-monitor extras), the description preamble, the
 * monitor refine, and the executor.
 */

import * as turf from '@turf/turf';
import * as h3 from 'h3-js';
import { z } from 'zod';
import { runIncidentSpec } from '../../state';
import type { EntryDataKind, ToolBuildOptions, ToolEntryBuilder, ToolState } from '../../types';
import {
    ALL_ENTRY_DATA_KINDS,
    ANALYSE_OUTPUT_FORMAT_DESCRIPTION,
    type AnalysisOutputFormat,
    buildAnalyseReturnPrompt,
    buildAtLeastOneEntryIdMessage,
    buildEntryFieldList,
    buildEntryIdFields,
    buildEntryKindSandboxDocs,
    buildEntryKindSchemaDocs,
    buildEntryKindScopeSchema,
    buildSandboxCodePrompt,
    CROSS_KIND_OPS_DOC,
    type EntryKindScope,
    GEOMETRIES_PROPS_DOC,
    GEOMETRIES_SKIPPED_DESC,
    GEOMETRIES_SOURCE_IDS_DESC,
    type GeometriesId,
    hasAnyEntryIds,
    isKindActive,
    MULTI_INPUT_SANDBOX_PARAMS,
    packSandboxArgs,
    prepareMultiInputs,
    resolveActiveKinds,
    runSandboxedFn,
    skippedSourceSchema,
    validateAnalysisResult,
} from '../shared';
import { toolErrorSchema } from '../shared-output-schemas';

/**
 * Per-turn scope kinds that `analyseData` understands. Identical to {@link EntryDataKind}
 * — every kind that's an analyseData input also accepts a scoped narrow.
 *
 * @group Agent Toolkit
 */
export type AnalyseDataKind = EntryDataKind;

/**
 * Per-turn scope for `analyseData`. Emitted by the classifier in
 * `toolScopes.analyseData` when only a subset of input kinds is relevant.
 *
 * Object-shaped so future per-tool scope additions (e.g. flags) don't break
 * the wire format.
 *
 * @group Agent Toolkit
 */
export type AnalyseDataScope = EntryKindScope;

/**
 * Default scope schema for analyseData — accepts every {@link EntryDataKind}. When
 * the agent narrows the enabled kinds via `createMapAgent`'s `dataEntries`, the
 * builder produces a narrower schema in {@link buildAnalyseDataEntry}.
 *
 * Exported for backward compat with consumers that imported the static schema.
 */
export const analyseDataScopeSchema = buildEntryKindScopeSchema(ALL_ENTRY_DATA_KINDS);

/** Output schema for analyse-data. */
export const analyseDataOutputSchema = z.union([
    z.object({
        affectedEntries: z
            .array(
                z.union([
                    z.object({ kind: z.literal('places'), id: z.string() }),
                    z.object({ kind: z.literal('routes'), id: z.string() }),
                    z.object({ kind: z.literal('incidents'), id: z.string() }),
                    z.object({ kind: z.literal('customGeometries'), id: z.string() }),
                    z.object({ kind: z.literal('trafficAreaAnalytics'), id: z.string() }),
                ]),
            )
            .describe(
                'Entries the analysis was attached to: every contributing places / routes / incidents / ' +
                    'customGeometries / trafficAreaAnalytics entry. Ranges entries feed the aggregation but do not carry analyses.',
            ),
        sourceIds: z
            .array(z.unknown())
            .optional()
            .describe(`${GEOMETRIES_SOURCE_IDS_DESC} (only present when \`geometriesEntryIDs\` was set).`),
        name: z.string().describe('Unique name of the analysis within each affected entry.'),
        description: z.string().optional(),
        outputFormat: z.enum(['json', 'chart']),
        analysis: z.unknown(),
        skipped: z.array(skippedSourceSchema).optional().describe(GEOMETRIES_SKIPPED_DESC),
        focused: z
            .object({
                incidentsEntryID: z.string(),
                focusedCount: z.number(),
                droppedIds: z.array(z.string()),
                reason: z.string().optional(),
            })
            .optional()
            .describe(
                'Present when the analysis ran with `monitor` AND returned `focusIds: string[]` (+ optional ' +
                    '`focusReason`). The tool applied that focus as a side-effect on the source incidents entry.',
            ),
    }),
    toolErrorSchema,
]);

/** Build the scope-aware `code` field description for analyse-data. */
export const buildAnalyseDataCodeDoc = (
    enabled: readonly EntryDataKind[],
    scope: AnalyseDataScope | undefined,
): string => {
    const active = resolveActiveKinds(enabled, scope);
    const sandboxList = buildEntryKindSandboxDocs(active);
    // Deep per-kind schema docs are gated on `scope !== undefined` — they only appear once
    // the classifier commits to specific kinds. The unscoped fallback shows only the terse
    // one-liners, which is enough to write reasonable code without 3-4 KB of schema
    // reference per kind.
    const schemaBlocks = scope ? buildEntryKindSchemaDocs(active) : '';
    // Cross-kind ops cheat-sheet only matters when more than one kind is in scope. It's a
    // sizeable doc (~2 KB) so we keep it strictly gated on scoped + multi-kind.
    const showCrossKind = !!scope && active.length > 1;
    // Geometries provenance doc only matters when customGeometries is actually in scope.
    const showGeometriesProps = !!scope && active.includes('customGeometries');
    // Incidents monitor + focus side-effect blocks only matter when incidents is in scope.
    // ~400 tokens and irrelevant to non-incidents analyses, so gate them too.
    const showIncidentsExtras = !scope || active.includes('incidents');
    const incidentsExtras = showIncidentsExtras
        ? 'When `monitor: { entryId }` is set, the call ALSO registers as a recurring spec on that incidents entry. ' +
          'On every monitor tick the code re-runs against the fresh `incidents` snapshot and these EXTRA sandbox args ' +
          'become available:\n' +
          '• `previous` — your last result for this `name` on the source entry, or `undefined` on the first run. Use it ' +
          'for id stability (e.g. reuse a prior cluster id when memberIds overlap by ≥50%) and short trend reads ' +
          "('growing' / 'fading' / 'steady'). Always guard `previous === undefined` — true on every first run.\n" +
          '• `now: Date` — call-start time; compare against `startTime` / `endTime` on incidents.\n' +
          '• `log: (...args) => void` — writes into the response logs.\n' +
          'Constraint: cross-kind reruns are NOT supported — when `monitor` is set, `incidentsEntryIDs: [monitor.entryId]` ' +
          'is the only allowed input. For one-shot cross-kind incidents analysis (no rerun), omit `monitor`.\n' +
          'FOCUS SIDE-EFFECT: when `applyFocus !== false` AND the result has `focusIds: string[]` (+ optional ' +
          '`focusReason`), `setFocus` is called once on the source entry to dim/highlight the listed incidents. ' +
          'One-shot — the focus side-effect does NOT re-apply on monitor-tick replays.\n\n'
        : '';
    return (
        'Async JS that aggregates the injected inputs and returns the result.\n\n' +
        `${buildSandboxCodePrompt(MULTI_INPUT_SANDBOX_PARAMS)}\n\n` +
        'Each input is `undefined` when its `*EntryIDs` argument was omitted — guard before reading ' +
        '(`if (places) ...`, `routes?.features.length`, etc.). When defined:\n' +
        `${sandboxList}\n\n` +
        incidentsExtras +
        (showCrossKind ? `${CROSS_KIND_OPS_DOC}\n\n` : '') +
        `${buildAnalyseReturnPrompt('counts, per-kind breakdowns, hex bins, intersections, distance bins')}\n\n` +
        (showGeometriesProps ? `${GEOMETRIES_PROPS_DOC}\n\n` : '') +
        schemaBlocks
    );
};

/** Build the scope-aware analyseData tool input schema. */
export const buildAnalyseDataSchema = (enabled: readonly EntryDataKind[], scope: AnalyseDataScope | undefined) => {
    const active = resolveActiveKinds(enabled, scope);
    const requiredHint = `At least one of ${buildEntryFieldList(active)} is REQUIRED.`;
    const shape: Record<string, z.ZodTypeAny> = {
        ...buildEntryIdFields(active, { verb: 'analyse', requiredHint }),
    };

    shape.name = z
        .string()
        .describe(
            'Unique name within each affected entry (e.g. "incidents-per-cluster", "ev-near-route"). ' +
                'Reusing a name replaces the previous analysis on those entries.',
        );
    shape.description = z.string().optional().describe('Optional short description of what the analysis computes.');
    shape.outputFormat = z.enum(['json', 'chart']).optional().describe(ANALYSE_OUTPUT_FORMAT_DESCRIPTION);
    shape.code = z.string().describe(buildAnalyseDataCodeDoc(enabled, scope));

    // Monitor + applyFocus are only meaningful when `incidents` is in the active set. Out of
    // scope or disabled at the agent level → drop both fields entirely so the LLM doesn't see
    // surface that can't be exercised.
    const incidentsActive = isKindActive(enabled, scope, 'incidents');
    if (incidentsActive) {
        shape.monitor = z
            .object({
                entryId: z
                    .string()
                    .describe(
                        'Incidents entry id to register the spec on. Must match `incidentsEntryIDs[0]`. The spec re-runs on every monitor-tick of that entry.',
                    ),
            })
            .optional()
            .describe(
                'Opt-in: register this analysis as a recurring spec on the targeted incidents entry. The code re-runs ' +
                    'on every monitor-tick with extra sandbox args (`previous`, `now`, `log`). When set, only ' +
                    '`incidentsEntryIDs: [monitor.entryId]` is allowed alongside — cross-kind reruns are not supported.',
            );
        shape.applyFocus = z
            .boolean()
            .optional()
            .describe(
                'When `monitor` is set AND the result has `focusIds: string[]` (+ optional `focusReason`), call ' +
                    '`setFocus` on the source entry to dim/highlight those incidents. Default: true. One-shot — the ' +
                    'focus side-effect does NOT re-apply on monitor-tick replays.',
            );
    }

    const baseObject = z.object(shape);

    return baseObject.refine(hasAnyEntryIds, { message: buildAtLeastOneEntryIdMessage(active) }).refine(
        (v: Record<string, unknown>) => {
            const monitor = v.monitor as { entryId: string } | undefined;
            if (!monitor) return true;
            // Monitor requires incidentsEntryIDs to match the targeted entry, and no other input kinds.
            const incidents = v.incidentsEntryIDs as string[] | undefined;
            const incidentsOk = Array.isArray(incidents) && incidents.length === 1 && incidents[0] === monitor.entryId;
            if (!incidentsOk) return false;
            // No other *EntryIDs may be present alongside incidents.
            for (const kind of ALL_ENTRY_DATA_KINDS) {
                if (kind === 'incidents') continue;
                const fieldName = `${kind === 'customGeometries' ? 'geometries' : kind}EntryIDs`;
                const value = v[fieldName] as unknown[] | undefined;
                if (value?.length) return false;
            }
            return true;
        },
        {
            message:
                'When `monitor` is set, only `incidentsEntryIDs: [monitor.entryId]` is allowed (cross-kind reruns are not supported in the lean merge). ' +
                'Omit `monitor` for one-shot cross-kind incidents analysis.',
        },
    );
};

/** Default full-surface input schema for analyse-data — every kind enabled, no per-turn scope. */
export const analyseDataSchema = buildAnalyseDataSchema(ALL_ENTRY_DATA_KINDS, undefined);

/** Build the scope-aware analyseData tool description. */
export const buildAnalyseDataDescription = (
    enabled: readonly EntryDataKind[],
    scope: AnalyseDataScope | undefined,
): string => {
    const active = resolveActiveKinds(enabled, scope);
    const kindList = active.join(' / ');
    const incidentsTail =
        scope && active.includes('incidents')
            ? 'Opt-in `monitor: { entryId }` registers the call as a recurring spec on the targeted incidents entry; ' +
              'opt-in `applyFocus` honours `focusIds: string[]` by calling `setFocus`.'
            : '';
    const contrast =
        'CONTRAST `processData`, which writes NEW renderable map entries (places / custom-geometries / BYOD); ' +
        '`analyseData` never renders or creates entries — only attaches metadata.';
    if (scope) {
        return (
            `Aggregate ${kindList} entries via dynamic JS — counts, groupings, charts, hex bins, ` +
            `cross-kind correlations. ${contrast} Each scoped input is exposed as a merged collection and a ` +
            'per-entry record; fields are `undefined` when their `*EntryIDs` argument is omitted (guard with `?.`). ' +
            'Result is attached as `_analysis[name]` on every contributing entry. ' +
            '`outputFormat: "json"` (default) or `"chart"` (Chart.js config). ' +
            incidentsTail
        );
    }
    const incidentsUnscopedTail = active.includes('incidents')
        ? 'Opt-in `monitor: { entryId }` registers the call as a recurring spec on the targeted incidents entry — the ' +
          'code re-runs on every monitor-tick with `previous` / `now` / `log` available in the sandbox. When `monitor` ' +
          'is set, only `incidentsEntryIDs: [monitor.entryId]` is allowed alongside (no cross-kind reruns). ' +
          'Opt-in `applyFocus` (default true under `monitor`) honours `focusIds: string[]` on the result by calling ' +
          '`setFocus` on the source entry to dim/highlight a subset.'
        : '';
    return (
        `Aggregate ${kindList} entries via dynamic JS — counts, groupings, charts, hex bins, cross-kind correlations. ` +
        `${contrast} ` +
        'Each input is exposed as a merged collection and a per-entry record; fields are `undefined` when their ' +
        '`*EntryIDs` argument is omitted (guard with `?.` / `if (places) …`). ' +
        'Result is attached as `_analysis[name]` on every contributing entry (ranges feed in but do not carry ' +
        'analyses; BYOD entries are read-only). `outputFormat: "json"` (default) or `"chart"` (Chart.js config). ' +
        incidentsUnscopedTail
    );
};

/** Default full-surface description — every kind enabled. */
export const analyseDataDescription = buildAnalyseDataDescription(ALL_ENTRY_DATA_KINDS, undefined);

// Build the classifier hint dynamically so disabled kinds don't appear as scope choices.
const buildAnalyseDataScopePrompt = (enabled: readonly EntryDataKind[]): string => {
    const list = enabled.map((k) => `"${k}"`).join(' | ');
    return (
        `Emit \`{ kinds: [${list}] }\` ` +
        'listing only the entry kinds the user query touches. Omit when truly cross-kind (covers all).'
    );
};

// Every state slice's `addAnalysisToEntry` matches this shape — the per-slice `Analysis`
// type is structurally identical across places/routes/incidents/trafficAreaAnalytics/custom.
type AnalysisSink<E extends { id: string }> = {
    addAnalysisToEntry: (entryId: E['id'], analysis: AnalysisRecord) => boolean;
};

type AnalysisRecord = {
    name: string;
    timestamp: number;
    description?: string;
    outputFormat: AnalysisOutputFormat;
    data: unknown;
};

// Attach an analysis to every entry in `entries` on `slice`. Shares the timestamp across the
// batch so the agent UI can correlate per-slice updates that originated from the same call.
const attachAnalysisToEntries = <E extends { id: string }>(
    slice: AnalysisSink<E>,
    entries: readonly E[],
    payload: {
        name: string;
        description?: string;
        outputFormat: AnalysisOutputFormat;
        analysis: unknown;
        timestamp?: number;
    },
): void => {
    const timestamp = payload.timestamp ?? Date.now();
    for (const entry of entries) {
        slice.addAnalysisToEntry(entry.id, {
            name: payload.name,
            timestamp,
            ...(payload.description && { description: payload.description }),
            outputFormat: payload.outputFormat,
            data: payload.analysis,
        });
    }
};

type AnalyseDataInput = {
    placesEntryIDs?: string[];
    routesEntryIDs?: string[];
    incidentsEntryIDs?: string[];
    geometriesEntryIDs?: GeometriesId[];
    trafficAreaAnalyticsEntryIDs?: string[];
    byodEntryIDs?: string[];
    name: string;
    description?: string;
    code: string;
    outputFormat?: 'json' | 'chart';
    monitor?: { entryId: string };
    applyFocus?: boolean;
};

export const executeAnalyseData = async (
    params: AnalyseDataInput,
    state: ToolState,
): Promise<z.infer<typeof analyseDataOutputSchema>> => {
    const {
        placesEntryIDs,
        routesEntryIDs,
        incidentsEntryIDs,
        geometriesEntryIDs,
        trafficAreaAnalyticsEntryIDs,
        byodEntryIDs,
        name,
        description,
        code,
        monitor,
        applyFocus,
    } = params;
    const outputFormat = params.outputFormat ?? 'json';

    // Monitor path: register a recurring spec on the source incidents entry, run with the
    // incidents-only sandbox surface (incidents / h3 / turf / now / log / previous), then
    // optionally apply the focus side-effect. Mirrors the old analyse-incidents semantics
    // but lives behind the analyseData surface.
    if (monitor) {
        return runMonitorPath(state, monitor.entryId, name, description, code, outputFormat, applyFocus !== false);
    }

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
    const { resolved, sandbox, geometries: geometriesMeta } = prepared.value;

    const sandboxResult = await runSandboxedFn(
        code,
        MULTI_INPUT_SANDBOX_PARAMS,
        packSandboxArgs(sandbox, { h3, turf }),
        'Analysis',
    );
    if ('error' in sandboxResult) return { error: sandboxResult.error };

    const validated = validateAnalysisResult(sandboxResult.value, outputFormat);
    if ('error' in validated) return { error: validated.error };
    const analysis = validated.value;

    // Attach to every contributing entry across all slices, with a shared
    // timestamp so the UI can correlate the per-slice updates back to one call.
    const timestamp = Date.now();
    const payload = { name, description, outputFormat, analysis, timestamp };
    attachAnalysisToEntries(state.places, resolved.places, payload);
    attachAnalysisToEntries(state.routing, resolved.routes, payload);
    attachAnalysisToEntries(state.trafficIncidents, resolved.incidents, payload);
    attachAnalysisToEntries(state.trafficAreaAnalytics, resolved.trafficAreaAnalytics, payload);
    // Geometries pull in places + custom entries indirectly via `collectInputGeometries`.
    attachAnalysisToEntries(
        state.places,
        geometriesMeta.affectedEntries.filter((e) => e.kind === 'places').map((e) => ({ id: e.id })),
        payload,
    );
    attachAnalysisToEntries(
        state.customGeometries,
        geometriesMeta.affectedEntries.filter((e) => e.kind === 'customGeometries').map((e) => ({ id: e.id })),
        payload,
    );

    const affectedEntries: Array<{
        kind: 'places' | 'routes' | 'incidents' | 'customGeometries' | 'trafficAreaAnalytics';
        id: string;
    }> = [
        ...resolved.places.map((e) => ({ kind: 'places' as const, id: e.id })),
        ...resolved.routes.map((e) => ({ kind: 'routes' as const, id: e.id })),
        ...resolved.incidents.map((e) => ({ kind: 'incidents' as const, id: e.id })),
        ...resolved.trafficAreaAnalytics.map((e) => ({ kind: 'trafficAreaAnalytics' as const, id: e.id })),
        ...geometriesMeta.affectedEntries
            .filter((e) => e.kind === 'places' && !resolved.places.some((p) => p.id === e.id))
            .map((e) => ({ kind: 'places' as const, id: e.id })),
        ...geometriesMeta.affectedEntries
            .filter((e) => e.kind === 'customGeometries')
            .map((e) => ({ kind: 'customGeometries' as const, id: e.id })),
    ];

    const sourceIds: GeometriesId[] | undefined = geometriesEntryIDs ? geometriesMeta.sourceIds : undefined;

    return {
        affectedEntries,
        ...(sourceIds && { sourceIds }),
        name,
        ...(description && { description }),
        outputFormat,
        analysis,
        ...(geometriesMeta.skipped.length && { skipped: geometriesMeta.skipped }),
    };
};

/**
 * Monitor path — incidents-only spec rerun. Mirrors the old `executeAnalyseIncidents` but
 * returns analyseData's output shape (affectedEntries + optional focused).
 *
 * Registers the spec BEFORE the first run so monitor-tick replays survive an initial-run
 * error. The focus side-effect is one-shot — replays read the registered spec but skip the
 * setFocus call.
 */
const runMonitorPath = async (
    state: ToolState,
    entryId: string,
    name: string,
    description: string | undefined,
    code: string,
    outputFormat: 'json' | 'chart',
    applyFocus: boolean,
): Promise<z.infer<typeof analyseDataOutputSchema>> => {
    const sourceEntry = state.trafficIncidents.entries.find((e) => e.id === entryId);
    if (!sourceEntry) {
        return {
            error: `No incidents entry with id "${entryId}". Call getTrafficIncidents first.`,
        };
    }

    const spec = {
        name,
        ...(description && { description }),
        outputFormat,
        code,
        source: sourceEntry.id,
    };
    const previous = sourceEntry._analyses?.getResult(name)?.data;

    // Register the spec before the first run so a failing initial run still leaves the spec
    // available for the next monitor tick to retry. Replay drops failures silently.
    state.trafficIncidents.setAnalysisSpec(spec);

    const sampledAt = sourceEntry.timestamp;
    const result = await runIncidentSpec(spec, sourceEntry.data, previous, sampledAt);
    if ('error' in result) return { error: result.error };

    const { value: analysis } = result;
    attachAnalysisToEntries(state.trafficIncidents, [sourceEntry], {
        name,
        description,
        outputFormat,
        analysis,
        timestamp: sampledAt,
    });

    const focused = applyFocus ? applyFocusSideEffect(analysis, sourceEntry.id, state) : undefined;

    return {
        affectedEntries: [{ kind: 'incidents' as const, id: sourceEntry.id }],
        name,
        ...(description && { description }),
        outputFormat,
        analysis,
        ...(focused && { focused }),
    };
};

type FocusSideEffect = {
    incidentsEntryID: string;
    focusedCount: number;
    droppedIds: string[];
    reason?: string;
};

// Honour `focusIds` / `focusReason` on the analysis result by calling `setFocus` against the
// source incidents entry. No-op when the result does not carry valid focus ids.
const applyFocusSideEffect = (
    analysis: unknown,
    targetEntryID: string,
    state: ToolState,
): FocusSideEffect | undefined => {
    if (!analysis || typeof analysis !== 'object') return undefined;
    const focusIds = (analysis as { focusIds?: unknown }).focusIds;
    if (!Array.isArray(focusIds) || focusIds.length === 0) return undefined;
    const ids = focusIds.filter((id): id is string => typeof id === 'string');
    if (ids.length === 0) return undefined;
    const reasonRaw = (analysis as { focusReason?: unknown }).focusReason;
    const reason = typeof reasonRaw === 'string' ? reasonRaw : undefined;
    const result = state.trafficIncidents.setFocus(targetEntryID, ids, reason);
    return {
        incidentsEntryID: targetEntryID,
        focusedCount: result.focusedCount,
        droppedIds: result.droppedIds,
        ...(reason && { reason }),
    };
};

/**
 * Scope-aware builder for the analyseData tool. Reads classifier-resolved `scope` AND the
 * agent's `enabledDataKinds` from {@link ToolBuildOptions} so disabled kinds disappear from
 * the description, schema, code-doc, classifier scope, and the monitor refine. Without
 * either, emits the full surface unchanged. Caller supplies static metadata (tags,
 * examples, related/depends, classificationPrompt) via the second positional arg so the
 * registry stays the single source of truth for those.
 */
export const buildAnalyseDataEntry = (
    options: ToolBuildOptions<AnalyseDataScope>,
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
        description: buildAnalyseDataDescription(enabled, options.scope),
        inputSchema: buildAnalyseDataSchema(enabled, options.scope),
        outputSchema: analyseDataOutputSchema,
        execute: executeAnalyseData as (input: unknown, state: ToolState) => Promise<unknown>,
        scopeSchema: buildEntryKindScopeSchema(enabled),
        scopePrompt: buildAnalyseDataScopePrompt(enabled),
        ...metadata,
    };
};

/**
 * Default builder for the `analyseData` tool. Reads classifier-resolved scope and
 * agent-level enabled kinds from {@link ToolBuildOptions} and produces a narrowed entry;
 * without either, emits the full surface unchanged. The registry supplies the rest of
 * the metadata.
 */
export const analyseDataBuilder =
    (metadata: {
        classificationPrompt?: string;
        tags?: string[];
        examples?: string[];
        examplePrompts?: string[];
        relatedTools?: string[];
        dependsOn?: string[];
    }): ToolEntryBuilder<ToolState, AnalyseDataScope> =>
    (options) =>
        buildAnalyseDataEntry(options, metadata);
