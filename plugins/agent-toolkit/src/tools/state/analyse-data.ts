/**
 * @module agent-toolkit-tools
 *
 * Sandbox-running analysis tool. Accepts any combination of places / routes /
 * incidents / customGeometries / trafficAreaAnalytics / byod entries and exposes
 * them to user-authored JS as `places`, `routes`, `incidents`, `geometries`,
 * `trafficAreaAnalytics`, `byod` (and per-entry views), with `h3` and `turf`
 * available. The result is attached as `_analysis[name]` on every contributing
 * entry. This is a one-shot analysis: it never renders. Every run is also registered as a
 * (disabled) standing analysis and returns an `analysisId`; pass that to `monitorAnalysis` to make
 * it recompute on every source-entry change (the recurring sandbox then also sees `previous` /
 * `now` / `log`).
 *
 * **Scope + enablement.** Shared scaffolding in `tools/shared/entry-kinds.ts` builds
 * the per-kind input fields, the "at least one of …" message, the per-kind sandbox /
 * schema docs, and the scope schema. This file only adds the tool-specific surface:
 * `name` / `description` / `outputFormat`, the code-doc body, the description preamble,
 * and the executor.
 */

import * as turf from '@turf/turf';
import * as h3 from 'h3-js';
import { z } from 'zod';
import { makeAnalysisId } from '../../state';
import type { EntryDataKind, ToolBuildOptions, ToolEntryBuilder, ToolState } from '../../types';
import {
    ALL_ENTRY_DATA_KINDS,
    ANALYSE_OUTPUT_FORMAT_DESCRIPTION,
    buildAnalyseReturnPrompt,
    buildAtLeastOneEntryIdMessage,
    buildEntryFieldList,
    buildEntryIdFields,
    buildEntryKindSandboxDocs,
    buildEntryKindSchemaDocs,
    buildEntryKindScopeSchema,
    buildSandboxToolsDoc,
    type EntryKindScope,
    GEOMETRIES_PROPS_DOC,
    GEOMETRIES_SKIPPED_DESC,
    GEOMETRIES_SOURCE_IDS_DESC,
    type GeometriesId,
    hasAnyEntryIds,
    MULTI_INPUT_SANDBOX_PARAMS,
    packSandboxArgs,
    prepareMultiInputs,
    resolveActiveKinds,
    runSandboxedFn,
    skippedSourceSchema,
    validateAnalysisResult,
} from '../shared';
import { toolErrorSchema } from '../shared-output-schemas';
import { registerAnalysisJob } from './monitoring';

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
                    z.object({ kind: z.literal('byod'), id: z.string() }),
                ]),
            )
            .describe(
                'Entries the analysis was attached to: every contributing places / routes / incidents / ' +
                    'customGeometries / trafficAreaAnalytics / byod entry. Ranges entries feed the aggregation but do not carry analyses.',
            ),
        sourceIds: z
            .array(z.unknown())
            .optional()
            .describe(`${GEOMETRIES_SOURCE_IDS_DESC} (only present when \`geometriesEntryIDs\` was set).`),
        analysisId: z
            .string()
            .describe(
                'Stable handle for this analysis. Pass to `monitorAnalysis` to keep it recomputing whenever ' +
                    'its source entries change.',
            ),
        name: z.string().describe('Unique name of the analysis within each affected entry.'),
        description: z.string().optional(),
        outputFormat: z.enum(['json', 'chart']),
        monitoring: z
            .boolean()
            .optional()
            .describe('True when `monitor: true` was set — the analysis now recomputes on every source change.'),
        analysis: z.unknown(),
        skipped: z.array(skippedSourceSchema).optional().describe(GEOMETRIES_SKIPPED_DESC),
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
    // Geometries provenance doc only matters when customGeometries is actually in scope.
    const showGeometriesProps = !!scope && active.includes('customGeometries');
    return (
        'Async JS that aggregates the injected inputs and returns the result.\n\n' +
        buildSandboxToolsDoc(active, !!scope) +
        'Each input is `undefined` when its `*EntryIDs` argument was omitted — guard before reading ' +
        '(`if (places) ...`, `routes?.features.length`, etc.). When defined:\n' +
        `${sandboxList}\n\n` +
        // Cross-kind ops cheat-sheet is emitted inside `buildSandboxToolsDoc` (gated on scoped +
        // multi-kind); incidents-specific monitor extras are gone now that `monitorAnalysis` drives
        // recurrence generically.
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
    shape.monitor = z
        .boolean()
        .optional()
        .describe(
            'When true, keep this analysis live — it recomputes on every change to its source entries (a ' +
                'monitored incidents poll, a re-search, …), no separate monitorAnalysis call needed. Omit (or false) ' +
                'for a one-shot run; you can still toggle it later via monitorAnalysis using the returned `analysisId`.',
        );

    const baseObject = z.object(shape);

    return baseObject.refine(hasAnyEntryIds, { message: buildAtLeastOneEntryIdMessage(active) });
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
    const contrast =
        'CONTRAST `processData`, which writes NEW renderable map entries (places / custom-geometries / BYOD); ' +
        '`analyseData` never renders or creates entries — only attaches metadata. Returns an `analysisId`; pass it ' +
        'to `monitorAnalysis` to keep the analysis recomputing whenever its source entries change.';
    if (scope) {
        return (
            `Aggregate ${kindList} entries via dynamic JS — counts, groupings, charts, hex bins, ` +
            `cross-kind correlations. ${contrast} Each scoped input is exposed as a merged collection and a ` +
            'per-entry record; fields are `undefined` when their `*EntryIDs` argument is omitted (guard with `?.`). ' +
            'Result is attached as `_analysis[name]` on every contributing entry. ' +
            '`outputFormat: "json"` (default) or `"chart"` (Chart.js config).'
        );
    }
    return (
        `Aggregate ${kindList} entries via dynamic JS — counts, groupings, charts, hex bins, cross-kind correlations. ` +
        `${contrast} ` +
        'Each input is exposed as a merged collection and a per-entry record; fields are `undefined` when their ' +
        '`*EntryIDs` argument is omitted (guard with `?.` / `if (places) …`). ' +
        'Result is attached as `_analysis[name]` on every contributing entry (ranges feed in but do not carry ' +
        'analyses). `outputFormat: "json"` (default) or `"chart"` (Chart.js config).'
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
    monitor?: boolean;
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
    } = params;
    const outputFormat = params.outputFormat ?? 'json';

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
        state.codeExecution,
    );
    if ('error' in sandboxResult) return { error: sandboxResult.error };

    const validated = validateAnalysisResult(sandboxResult.value, outputFormat);
    if ('error' in validated) return { error: validated.error };
    const analysis = validated.value;
    const timestamp = Date.now();

    const affectedEntries: Array<{
        kind: 'places' | 'routes' | 'incidents' | 'customGeometries' | 'trafficAreaAnalytics' | 'byod';
        id: string;
    }> = [
        ...resolved.places.map((e) => ({ kind: 'places' as const, id: e.id })),
        ...resolved.routes.map((e) => ({ kind: 'routes' as const, id: e.id })),
        ...resolved.incidents.map((e) => ({ kind: 'incidents' as const, id: e.id })),
        ...resolved.trafficAreaAnalytics.map((e) => ({ kind: 'trafficAreaAnalytics' as const, id: e.id })),
        ...resolved.byod.map((e) => ({ kind: 'byod' as const, id: e.id })),
        ...geometriesMeta.affectedEntries
            .filter((e) => e.kind === 'places' && !resolved.places.some((p) => p.id === e.id))
            .map((e) => ({ kind: 'places' as const, id: e.id })),
        ...geometriesMeta.affectedEntries
            .filter((e) => e.kind === 'customGeometries')
            .map((e) => ({ kind: 'customGeometries' as const, id: e.id })),
    ];

    const sourceIds: GeometriesId[] | undefined = geometriesEntryIDs ? geometriesMeta.sourceIds : undefined;

    // Register this run as a standing analysis job (paused unless `monitor`) so `monitorAnalysis` can
    // later make it recurring without re-declaring the code, then attach the one-shot result (which backs
    // `previous`). The id is stable across an identical re-run. `affectedEntryIds` is the per-entry lookup
    // key for the result. Activating monitoring fires no `entries-change`, so it won't replay now; only
    // the next genuine change to a source entry does.
    const affectedEntryIds = affectedEntries.map((e) => e.id);
    const analysisId = makeAnalysisId(name, affectedEntryIds);
    const monitoring = params.monitor === true;
    registerAnalysisJob(state, {
        analysisId,
        name,
        description,
        outputFormat,
        code,
        inputs: {
            placesEntryIDs,
            routesEntryIDs,
            incidentsEntryIDs,
            geometriesEntryIDs,
            trafficAreaAnalyticsEntryIDs,
            byodEntryIDs,
        },
        affectedEntryIds,
        monitor: monitoring,
    });
    state.analyses.attachResult(analysisId, { name, description, outputFormat, data: analysis, timestamp });

    return {
        affectedEntries,
        ...(sourceIds && { sourceIds }),
        analysisId,
        name,
        ...(description && { description }),
        outputFormat,
        monitoring,
        analysis,
        ...(geometriesMeta.skipped.length && { skipped: geometriesMeta.skipped }),
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
