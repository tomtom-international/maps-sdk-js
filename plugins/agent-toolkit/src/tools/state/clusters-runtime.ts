/**
 * @module agent-toolkit-tools
 *
 * Runtime behind incident clustering — the compute + re-run for the `clusterIncidents` tool. Clustering
 * is NOT a generic analysis: its result is typed, dedicated `TrafficIncidentsState` state (`clusters`).
 * This module owns what the slice can't, and dispatches on the recipe kind:
 *
 * - `params` (the default): TRUSTED DBSCAN over the entry's own incidents — runs `runClustering` directly
 *   on the main thread. No sandbox, no worker dependency. The common path is therefore robust regardless of
 *   the browser sandbox build.
 * - `code` (opt-in dynamic): UNTRUSTED LLM-authored clustering — runs in the env-resolved sandbox executor
 *   (where the `cluster()` primitive is injected) over the recipe's multi-inputs, then guarded to a
 *   {@link SandboxClusteringOutput}. Only this path needs `self.cluster` bundled into the worker realm.
 *
 * Either way the result lands in the dedicated `clusters` store, and the re-run is wired to the incidents
 * slice's `entries-change` so clusters stay live across monitor ticks. The re-run is ASYNC to the tick —
 * the fresh result lands on the slice's `clusters-change` a step after `entries-change`.
 */

import { type ClusteringParams, isClusteringOutput, runClustering, type SandboxClusteringOutput } from '../../state';
import type { ToolState } from '../../types';
import { type MultiInputIds, prepareMultiInputs } from '../shared';
import { runPreparedSandbox } from '../shared/sandbox-replay';

/**
 * How an entry's clusters are (re)computed. `params` is the trusted default (main-thread `runClustering`);
 * `code` is opt-in LLM-authored clustering run in the sandbox over `inputs`.
 */
export type ClusterRecipe =
    | { kind: 'params'; params: ClusteringParams }
    | { kind: 'code'; code: string; inputs: MultiInputIds };

// Identity of a recipe — used to decide whether to thread the prior output as `previous` (same recipe) or
// start a fresh trend window (changed recipe). Cheap structural compare; recipes are small + JSON-safe.
const sameRecipe = (a: unknown, b: ClusterRecipe): boolean => JSON.stringify(a) === JSON.stringify(b);

// Compute a recipe against its source entry. `params` runs the trusted clusterer directly (no sandbox);
// `code` runs in the sandbox with the injected `cluster()` primitive and is guarded to a ClusteringOutput.
// Returns the typed output or an error string (never throws — a bad run can't break the tick that triggered it).
const execClustering = async (
    state: ToolState,
    entryId: string,
    recipe: ClusterRecipe,
    previous: SandboxClusteringOutput | undefined,
): Promise<{ value: SandboxClusteringOutput } | { error: string }> => {
    const entry = state.trafficIncidents.entries.find((e) => e.id === entryId);
    if (!entry) return { error: `unknown incidents entry "${entryId}"` };

    if (recipe.kind === 'params') {
        const { groups } = runClustering(
            entry.data,
            recipe.params,
            previous?.groups,
            entry.timestamp,
            previous?.sampledAt,
        );
        return { value: { groups, sampledAt: entry.timestamp } };
    }

    const prepared = await prepareMultiInputs(recipe.inputs, state);
    if ('error' in prepared) return prepared;
    const result = await runPreparedSandbox(state, prepared.value, {
        code: recipe.code,
        previous,
        sampledAt: entry.timestamp,
        outputFormat: 'json',
    });
    if ('error' in result) return result;
    // LLM-authored code can return anything; the typed store + cluster-pin UI require a real ClusteringOutput.
    if (!isClusteringOutput(result.value)) {
        return { error: 'clustering `code` must return a cluster(...) result (`{ groups }`)' };
    }
    return { value: result.value };
};

/**
 * Compute clustering for an entry and store it in the dedicated slice state. Arms the re-run wiring so the
 * clusters stay live across monitor ticks. A re-cluster with the SAME recipe threads the prior output as
 * `previous` (stable IDs + trends); a changed recipe starts fresh. Returns the typed output or an `error`
 * string (sandbox failure or a non-clustering `code` result) so the caller can surface why.
 *
 * @ignore
 */
export const runAndStoreClusters = async (
    state: ToolState,
    entryId: string,
    recipe: ClusterRecipe,
): Promise<{ value: SandboxClusteringOutput } | { error: string }> => {
    ensureClusterRerunWired(state);
    const existing = state.trafficIncidents.getClustersRecord(entryId);
    const previous = existing && sameRecipe(existing.recipe, recipe) ? existing.output : undefined;
    const result = await execClustering(state, entryId, recipe, previous);
    if ('error' in result) return result;
    state.trafficIncidents.setClusters(entryId, { recipe, output: result.value });
    return result;
};

// Re-run scheduling flags per session, kept off the (pure-data) slice. `running` drops a re-entrant pass
// (and a rare genuine change landing mid-run — self-correcting: the next change re-runs); `scheduled`
// coalesces a synchronous burst of `entries-change` into one pass; `pending` accumulates the changed
// entry ids across that burst so the pass re-runs exactly the entries whose incidents changed.
type RerunFlags = { running: boolean; scheduled: boolean; pending: Set<string> };
const rerunFlags = new WeakMap<ToolState, RerunFlags>();
const flagsFor = (state: ToolState): RerunFlags => {
    let flags = rerunFlags.get(state);
    if (!flags) {
        flags = { running: false, scheduled: false, pending: new Set() };
        rerunFlags.set(state, flags);
    }
    return flags;
};

const wired = new WeakSet<ToolState>();

/**
 * Subscribe the clustering re-run to the incidents slice's `entries-change`, exactly once per session.
 * Called from `clusterIncidents` (not the state factory) so the state layer never imports the tools layer.
 * Idempotent.
 *
 * @ignore
 */
export const ensureClusterRerunWired = (state: ToolState): void => {
    if (wired.has(state)) return;
    wired.add(state);
    state.trafficIncidents.events.on('entries-change', ({ changedIds }) => scheduleRerun(state, changedIds));
};

const scheduleRerun = (state: ToolState, changedIds: readonly string[]): void => {
    const flags = flagsFor(state);
    for (const id of changedIds) flags.pending.add(id);
    if (flags.running || flags.scheduled) return;
    flags.scheduled = true;
    queueMicrotask(() => {
        flags.scheduled = false;
        void rerunClusters(state);
    });
};

// Re-run the stored clustering recipe of every entry whose incidents changed this burst, writing the
// fresh output back into the slice. We re-run exactly the changed entries (matched by id) rather than
// scanning every entry — an unrelated entry's change can't trigger a needless re-cluster. `setClusters`
// emits `clusters-change` (not `entries-change`), so this never echoes into its own trigger. A recipe
// that errors on a tick is skipped (the last good result stays).
const rerunClusters = async (state: ToolState): Promise<void> => {
    const flags = flagsFor(state);
    const changed = flags.pending;
    flags.pending = new Set();
    flags.running = true;
    try {
        for (const entryId of changed) {
            const record = state.trafficIncidents.getClustersRecord(entryId);
            if (!record) continue;
            const recipe = record.recipe as ClusterRecipe;
            const result = await execClustering(state, entryId, recipe, record.output);
            if ('value' in result) {
                state.trafficIncidents.setClusters(entryId, { recipe, output: result.value });
            }
        }
    } finally {
        flags.running = false;
    }
};
