/**
 * @module agent-toolkit-tools
 */

import { z } from 'zod';
import type { ClusteringParams } from '../../state';
import type { EntryDataKind, ToolBuildOptions, ToolEntryBuilder, ToolState } from '../../types';
import {
    ALL_ENTRY_DATA_KINDS,
    buildEntryIdFields,
    buildEntryKindSandboxDocs,
    buildEntryKindSchemaDocs,
    buildEntryKindScopeSchema,
    buildSandboxToolsDoc,
    type EntryKindScope,
    type GeometriesId,
    type MultiInputIds,
    resolveActiveKinds,
} from '../shared';
import { toolErrorSchema } from '../shared-output-schemas';
import { type ClusterRecipe, runAndStoreClusters } from './clusters-runtime';

// `incidents` is always the clustering source. The other kinds are optional CONTEXT the custom `code`
// can filter against; they appear (as `*EntryIDs` fields + in the code docs) only when the per-turn
// scope opts them in — default is incidents-only, matching analyseData's scope model.
const resolveClusterKinds = (
    enabled: readonly EntryDataKind[],
    scope: EntryKindScope | undefined,
): { context: readonly EntryDataKind[]; active: readonly EntryDataKind[] } => {
    const context = scope ? resolveActiveKinds(enabled, scope).filter((kind) => kind !== 'incidents') : [];
    return { context, active: ['incidents', ...context] };
};

// Doc for the optional dynamic-clustering `code` body. Reuses the SAME sandbox-tools + per-kind schema
// docs as analyseData/processData (so the model knows the real `incidents` shape — `properties.delayInSeconds`,
// `properties.category`, … — instead of inventing fields), plus the rule that the result must come from
// the injected `cluster()` primitive. `active` always includes `incidents`; widened by scope.
const buildClusterIncidentsCodeDoc = (active: readonly EntryDataKind[]): string =>
    'OPTIONAL — omit for the default DBSCAN over all incidents (tune eps / minMembers / maxClusters). Async ' +
    'JS body: filter/combine the inputs, then RETURN `cluster(...)` (the only way to build the required ' +
    '`{ groups }` result) — e.g. `return cluster(filtered, { eps: 0.4 }, previous, now);`.\n\n' +
    // `scoped: true` so the cluster() primitive doc + per-kind docs always render for this tool.
    buildSandboxToolsDoc(active, true) +
    'Each input is `undefined` when its `*EntryIDs` argument was omitted — guard before reading. When defined:\n' +
    `${buildEntryKindSandboxDocs(active)}\n\n` +
    buildEntryKindSchemaDocs(active);

/** Build the scope-aware clusterIncidents input schema. */
export const buildClusterIncidentsSchema = (enabled: readonly EntryDataKind[], scope: EntryKindScope | undefined) => {
    const { context, active } = resolveClusterKinds(enabled, scope);
    return z.object({
        incidentsEntryID: z.string().describe('Entry id from getTrafficIncidents — the incidents to cluster.'),
        eps: z
            .number()
            .positive()
            .optional()
            .describe(
                'DBSCAN radius in km. Default 0.5. Use 0.3–0.5 for dense urban, 1+ for highways. Ignored when `code` is set.',
            ),
        minMembers: z
            .number()
            .int()
            .min(1)
            .optional()
            .describe('Minimum incidents per cluster. Default 3. Ignored when `code` is set.'),
        maxClusters: z
            .number()
            .int()
            .min(1)
            .optional()
            .describe('Top N clusters by total delay. Default 6. Ignored when `code` is set.'),
        // Context inputs the custom `code` may read — only present for kinds the per-turn scope added.
        ...buildEntryIdFields(context, { verb: 'analyse', requiredHint: 'Only used by custom `code`.' }),
        code: z.string().optional().describe(buildClusterIncidentsCodeDoc(active)),
    });
};

/** Default full-surface schema (incidents-only, no per-turn scope). */
export const clusterIncidentsSchema = buildClusterIncidentsSchema(ALL_ENTRY_DATA_KINDS, undefined);

export const clusterIncidentsOutputSchema = z.union([
    z.object({
        incidentsEntryID: z.string(),
        clusterCount: z.number(),
        clusters: z.array(
            z.object({
                id: z.string(),
                primaryRoads: z.array(z.string()),
                primaryCategory: z.string(),
                size: z.number(),
                totalDelaySeconds: z.number(),
                peakDelaySeconds: z.number(),
                trend: z.enum(['growing', 'fading', 'steady', 'new']),
            }),
        ),
    }),
    toolErrorSchema,
]);

const CLUSTER_BASE_DESCRIPTION =
    'DBSCAN clustering of traffic incidents into compact pockets — stable IDs (survive monitor ticks), ' +
    'road/category labels, delay aggregates, multi-poll trends. Stored as dedicated clustering state on the ' +
    'entry and re-run each monitor tick (stays live without re-calling); the UI pins each group. Returns ' +
    'structured fields (roads, category, size, delay, trend) for the caller to phrase. One clustering per ' +
    'entry (re-calling replaces it). Defaults to DBSCAN over all incidents (tune eps / minMembers / ' +
    'maxClusters); pass `code` to filter/combine incidents dynamically first. Pair with getTrafficIncidents ' +
    '+ setTrafficIncidentsMonitor.';

/** Build the scope-aware clusterIncidents description (notes any context kinds in scope). */
export const buildClusterIncidentsDescription = (active: readonly EntryDataKind[]): string => {
    const context = active.filter((kind) => kind !== 'incidents');
    return context.length
        ? `${CLUSTER_BASE_DESCRIPTION} Custom \`code\` can also filter incidents against ${context.join(' / ')}.`
        : CLUSTER_BASE_DESCRIPTION;
};

/** Default description (incidents-only). */
export const clusterIncidentsDescription = buildClusterIncidentsDescription(['incidents']);

// Classifier hint: incidents is always the source; widen only when the query filters against another kind.
const buildClusterIncidentsScopePrompt = (enabled: readonly EntryDataKind[]): string => {
    const list = enabled.map((kind) => `"${kind}"`).join(' | ');
    return (
        `Emit \`{ kinds: [${list}] }\` — always include "incidents" (the clustering source). Add another kind ` +
        'ONLY when the query filters incidents against it (e.g. "near depots" → places, "along the route" → routes, ' +
        '"within this zone" → customGeometries). Default: `{ kinds: ["incidents"] }`.'
    );
};

type ClusterIncidentsInput = {
    incidentsEntryID: string;
    eps?: number;
    minMembers?: number;
    maxClusters?: number;
    placesEntryIDs?: string[];
    routesEntryIDs?: string[];
    geometriesEntryIDs?: GeometriesId[];
    trafficAreaAnalyticsEntryIDs?: string[];
    byodEntryIDs?: string[];
    code?: string;
};

export const executeClusterIncidents = async (
    params: ClusterIncidentsInput,
    state: ToolState,
): Promise<z.infer<typeof clusterIncidentsOutputSchema>> => {
    const { incidentsEntryID, eps, minMembers, maxClusters, code } = params;
    const entry = state.trafficIncidents.entries.find((e) => e.id === incidentsEntryID);
    if (!entry) {
        return { error: `No incidents entry with id "${incidentsEntryID}". Call getTrafficIncidents first.` };
    }

    const clusterParams: ClusteringParams = {
        ...(eps != null && { eps }),
        ...(minMembers != null && { minMembers }),
        ...(maxClusters != null && { maxClusters }),
    };

    // Default (no `code`): trusted DBSCAN on the main thread — no sandbox, no worker dependency. Custom
    // `code`: LLM-authored, run in the sandbox over the entry's incidents plus any scoped context inputs
    // (`inputs` is cast to MultiInputIds — `prepareMultiInputs` resolves each kind by id).
    const recipe: ClusterRecipe = code
        ? {
              kind: 'code',
              code,
              inputs: {
                  incidentsEntryIDs: [incidentsEntryID],
                  ...(params.placesEntryIDs?.length && { placesEntryIDs: params.placesEntryIDs }),
                  ...(params.routesEntryIDs?.length && { routesEntryIDs: params.routesEntryIDs }),
                  ...(params.geometriesEntryIDs?.length && { geometriesEntryIDs: params.geometriesEntryIDs }),
                  ...(params.trafficAreaAnalyticsEntryIDs?.length && {
                      trafficAreaAnalyticsEntryIDs: params.trafficAreaAnalyticsEntryIDs,
                  }),
                  ...(params.byodEntryIDs?.length && { byodEntryIDs: params.byodEntryIDs }),
              } as MultiInputIds,
          }
        : { kind: 'params', params: clusterParams };

    // Store the typed result as dedicated clustering state on the entry. The monitor-tick re-run keeps it
    // live, threading the prior output for stable IDs + trend continuity (same recipe threads, a changed
    // one starts fresh). On failure the runtime returns the reason so the agent can correct.
    const result = await runAndStoreClusters(state, entry.id, recipe);
    if ('error' in result) {
        return { error: `Clustering failed for entry "${entry.id}": ${result.error}` };
    }
    const out = result.value;

    // Omit memberIds: clusters are UI-actionable (pins), not a chat-selection path.
    // The caller composes its read from roads, category, and the delay/trend numbers.
    return {
        incidentsEntryID: entry.id,
        clusterCount: out.groups.length,
        clusters: out.groups.map((cluster) => ({
            id: cluster.id,
            primaryRoads: cluster.primaryRoads,
            primaryCategory: cluster.primaryCategory,
            size: cluster.size,
            totalDelaySeconds: cluster.totalDelaySeconds,
            peakDelaySeconds: cluster.peakDelaySeconds,
            trend: cluster.trend,
        })),
    };
};

type ClusterIncidentsMetadata = {
    classificationPrompt?: string;
    tags?: string[];
    examples?: string[];
    examplePrompts?: string[];
    relatedTools?: string[];
    dependsOn?: string[];
};

/**
 * Scope-aware builder for the `clusterIncidents` tool. Reads agent-enabled kinds + the classifier's
 * per-turn scope from {@link ToolBuildOptions}; the schema/docs default to incidents-only and widen to
 * include context kinds (places / routes / …) only when the query filters against them.
 */
export const buildClusterIncidentsEntry = (
    options: ToolBuildOptions<EntryKindScope>,
    metadata: ClusterIncidentsMetadata,
) => {
    const enabled = options.enabledDataKinds ?? ALL_ENTRY_DATA_KINDS;
    const { active } = resolveClusterKinds(enabled, options.scope);
    return {
        description: buildClusterIncidentsDescription(active),
        inputSchema: buildClusterIncidentsSchema(enabled, options.scope),
        outputSchema: clusterIncidentsOutputSchema,
        execute: executeClusterIncidents as (input: unknown, state: ToolState) => Promise<unknown>,
        scopeSchema: buildEntryKindScopeSchema(enabled),
        scopePrompt: buildClusterIncidentsScopePrompt(enabled),
        ...metadata,
    };
};

/** Default builder for the `clusterIncidents` tool; the registry supplies the metadata. */
export const clusterIncidentsBuilder =
    (metadata: ClusterIncidentsMetadata): ToolEntryBuilder<ToolState, EntryKindScope> =>
    (options) =>
        buildClusterIncidentsEntry(options, metadata);
