/**
 * @module agent-toolkit-tools
 */

import { z } from 'zod';
import { type ClusteringOutput, type ClusteringParams, runClustering } from '../../state/traffic-incidents/clustering';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

/**
 * The single analysis name a clustering registers under. One clustering per entry:
 * a re-run replaces it. Consumers read it back via
 * `getAnalysisResult(entryId, CLUSTER_ANALYSIS_NAME)`.
 */
export const CLUSTER_ANALYSIS_NAME = 'clusters';

export const clusterIncidentsSchema = z.object({
    incidentsEntryID: z.string().describe('Entry id from getTrafficIncidents.'),
    eps: z
        .number()
        .positive()
        .optional()
        .describe('DBSCAN radius in km. Default 0.5. Use 0.3–0.5 for dense urban, 1+ for highways.'),
    minMembers: z.number().int().min(1).optional().describe('Minimum incidents per cluster. Default 3.'),
    maxClusters: z.number().int().min(1).optional().describe('Top N clusters by total delay. Default 6.'),
});

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

export const clusterIncidentsDescription =
    'Deterministic DBSCAN clustering of traffic incidents into compact geographic pockets. ' +
    'Produces stable cluster IDs (survive monitor ticks), road/category labels, delay aggregates, ' +
    'and multi-poll trend detection. Auto-registers as a monitor-rerunning spec — clusters stay live ' +
    'without re-calling. Returns structured fields (roads, category, size, delay, trend) the caller ' +
    'phrases into a read; the UI pins each group automatically. One clustering per entry — re-calling ' +
    'replaces it. Pair with getTrafficIncidents + startTrafficIncidentsMonitor.';

export const executeClusterIncidents = async (
    params: z.infer<typeof clusterIncidentsSchema>,
    state: ToolState,
): Promise<z.infer<typeof clusterIncidentsOutputSchema>> => {
    const { incidentsEntryID, eps, minMembers, maxClusters } = params;
    const entry = state.trafficIncidents.entries.find((e) => e.id === incidentsEntryID);
    if (!entry) {
        return { error: `No incidents entry with id "${incidentsEntryID}". Call getTrafficIncidents first.` };
    }

    const clusterParams: ClusteringParams = {
        ...(eps != null && { eps }),
        ...(minMembers != null && { minMembers }),
        ...(maxClusters != null && { maxClusters }),
    };

    // Register a deterministic spec so the monitor re-clusters on every tick,
    // threading the previous output back in for stable IDs + trend continuity.
    // `signature` keys the params: changing them resets the trend window; an
    // identical re-cluster preserves it. `runNow` produces the first result.
    // One clustering per entry — fixed name, so a re-call replaces it.
    // Use the returned result directly: a falsy return means the run threw
    // (swallowed, symmetric with replay), never a stale prior result.
    const out = (await state.trafficIncidents.setDeterministicSpec(
        {
            name: CLUSTER_ANALYSIS_NAME,
            source: entry.id,
            signature: JSON.stringify(clusterParams),
            run: (data, { previous, sampledAt, previousSampledAt }) =>
                runClustering(
                    data,
                    clusterParams,
                    (previous as ClusteringOutput | undefined)?.groups,
                    sampledAt,
                    previousSampledAt,
                ),
        },
        { runNow: true },
    )) as ClusteringOutput | undefined;
    if (!out) {
        return { error: `Clustering failed for entry "${entry.id}".` };
    }

    // Omit memberIds: clusters are UI-actionable (pins), not a chat-selection path.
    // The caller composes its read from roads, category, and the delay/trend numbers.
    return {
        incidentsEntryID: entry.id,
        clusterCount: out.groups.length,
        clusters: out.groups.map((g) => ({
            id: g.id,
            primaryRoads: g.primaryRoads,
            primaryCategory: g.primaryCategory,
            size: g.size,
            totalDelaySeconds: g.totalDelaySeconds,
            peakDelaySeconds: g.peakDelaySeconds,
            trend: g.trend,
        })),
    };
};
