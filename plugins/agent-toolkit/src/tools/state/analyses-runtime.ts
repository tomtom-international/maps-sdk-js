/**
 * @module agent-toolkit-tools
 *
 * Runtime behind the `analyseData` standing sweep — the recurring half of `analyseData` /
 * `monitorAnalysis`. Owns the two things the {@link Analyses} registry (state layer) deliberately
 * doesn't: the sandbox replay (via the shared {@link runPreparedSandbox} step) and the event wiring that
 * triggers it.
 *
 * Lives in the tools layer because it needs `prepareMultiInputs`; the registry stays import-clean so it
 * can sit on {@link ToolState}. Wiring is lazy + idempotent ({@link ensureStandingWired}) so the state
 * factory never has to reach into the tools layer.
 *
 * Trigger model: every input slice's `entries-change` carries the ids of the entries it changed; each
 * one accumulates those ids and schedules one debounced sweep. The sweep replays exactly the enabled
 * records ({@link Analyses.sweepCandidates}) whose `affectedEntryIds` intersect the accumulated changed
 * ids — an unrelated entry's change matches nothing and runs nothing. There is no attach-echo to guard
 * against: `attachResult` emits `analysis-change` (UI-only), never `entries-change`, so a replay can't
 * re-trigger the sweep.
 *
 * Incident clustering does NOT ride this sweep — it is dedicated, typed `TrafficIncidentsState`
 * (`clusters`) re-run from `tools/state/clusters-runtime.ts` (which shares {@link runPreparedSandbox}).
 */

import type { Analyses, AnalysisType } from '../../state';
import type { ToolState } from '../../types';
import { type AnalysisOutputFormat, type MultiInputIds, prepareMultiInputs, type ResolvedEntries } from '../shared';
import { runPreparedSandbox } from '../shared/sandbox-replay';

// Per-registry runtime flags kept off the (pure-data) registry. `sweeping` ignores any genuine change
// landing mid-sweep (a rare, self-correcting loss — the next change re-runs it); `scheduled` coalesces
// a synchronous burst of `entries-change` into one sweep; `pending` accumulates the changed entry ids
// across that burst so the sweep replays exactly the records whose sources moved.
type RuntimeFlags = { sweeping: boolean; scheduled: boolean; pending: Set<string> };
const runtimeFlags = new WeakMap<Analyses, RuntimeFlags>();
const flagsFor = (registry: Analyses): RuntimeFlags => {
    let flags = runtimeFlags.get(registry);
    if (!flags) {
        flags = { sweeping: false, scheduled: false, pending: new Set() };
        runtimeFlags.set(registry, flags);
    }
    return flags;
};

/**
 * Subscribe the standing-analysis sweep to every input slice's `entries-change`, exactly once per
 * session. Called from `analyseData` / `monitorAnalysis` rather than the state factory so the state
 * layer never imports the tools layer.
 *
 * @ignore
 */
export const ensureStandingWired = (state: ToolState): void => {
    const registry = state.analyses;
    if (registry.wired) return;
    registry.markWired();
    // Subscribe per slice rather than over a heterogeneous list — each slice's `events.on` is generic
    // over its own event map, so a single loop wouldn't typecheck. Every slice's `entries-change`
    // carries `changedIds`, so a handler reading only that field is assignable to all of them. Slices
    // whose entries feed analyseData: places / routes / incidents / area-analytics / byod /
    // custom-geometries. Ranges feed in but never carry analyses.
    const onChange = (payload: { changedIds: readonly string[] }) => {
        pruneOrphans(state);
        const flags = flagsFor(state.analyses);
        for (const id of payload.changedIds) flags.pending.add(id);
        scheduleSweep(state);
    };
    state.places.events.on('entries-change', onChange);
    state.routing.events.on('entries-change', onChange);
    state.trafficIncidents.events.on('entries-change', onChange);
    state.trafficAreaAnalytics.events.on('entries-change', onChange);
    state.byod.events.on('entries-change', onChange);
    state.customGeometries.events.on('entries-change', onChange);
};

// Drop analysis records whose source entries have all been removed. Entries no longer carry their
// analyses, so removal can't GC them implicitly; we prune on every `entries-change` against the live
// source-entry ids (read per-slice — the slices' `entries` are heterogeneous, but all carry `id`).
const pruneOrphans = (state: ToolState): void => {
    const live = new Set<string>();
    const add = (entries: readonly { id: string }[]) => {
        for (const entry of entries) live.add(entry.id);
    };
    add(state.places.entries);
    add(state.routing.entries);
    add(state.trafficIncidents.entries);
    add(state.trafficAreaAnalytics.entries);
    add(state.byod.entries);
    add(state.customGeometries.entries);
    state.analyses.pruneToLiveEntries(live);
};

const scheduleSweep = (state: ToolState): void => {
    const registry = state.analyses;
    const flags = flagsFor(registry);
    // Collapse a synchronous burst (scheduled) and ignore changes landing mid-sweep (sweeping).
    if (flags.sweeping || flags.scheduled) return;
    // Nothing monitored — drop the accumulated ids so `pending` can't grow unbounded.
    if (registry.sweepCandidates().length === 0) {
        flags.pending.clear();
        return;
    }
    flags.scheduled = true;
    queueMicrotask(() => {
        flags.scheduled = false;
        void runSweep(state);
    });
};

const runSweep = async (state: ToolState): Promise<void> => {
    const registry = state.analyses;
    const flags = flagsFor(registry);
    const changed = flags.pending;
    flags.pending = new Set();
    flags.sweeping = true;
    try {
        // Replay only the records whose sources actually moved — an unrelated entry's change leaves
        // every `affectedEntryIds` disjoint from `changed` and runs nothing.
        for (const record of registry.sweepCandidates()) {
            if (!record.affectedEntryIds.some((id) => changed.has(id))) continue;
            await replayRecord(state, record.analysisId);
        }
    } finally {
        flags.sweeping = false;
    }
};

// Re-run one record against fresh state. Re-reads the record each call (it may have been toggled off or
// replaced mid-sweep), re-prepares the merged inputs, then runs the stored code via the shared
// sandbox-replay step. Bails on any soft failure — a vanished source entry, a sandbox throw, or an
// invalid result must never break the change event that triggered the sweep.
const replayRecord = async (state: ToolState, analysisId: string): Promise<void> => {
    const record = state.analyses.get(analysisId);
    if (!record?.enabled || record.code === undefined) return;

    const prepared = await prepareMultiInputs(record.inputs as MultiInputIds, state);
    if ('error' in prepared) return;

    const sampledAt = latestTimestamp(prepared.value.resolved) ?? Date.now();
    const result = await runPreparedSandbox(state, prepared.value, {
        code: record.code,
        previous: state.analyses.lastResult(analysisId),
        sampledAt,
        outputFormat: record.outputFormat,
    });
    if ('error' in result) return;

    state.analyses.attachResult(analysisId, {
        name: record.name,
        ...(record.description && { description: record.description }),
        outputFormat: record.outputFormat,
        data: result.value,
        timestamp: sampledAt,
    });
};

/**
 * Register a freshly-run one-shot analysis as a (disabled) SANDBOX record so `monitorAnalysis` can
 * later flip it on without re-declaring the code. Enabling it never replays on its own (it fires no
 * `entries-change`); only the next genuine change to a source entry does. The caller attaches the
 * one-shot result separately (via `state.analyses.attachResult`) so it backs `previous`.
 *
 * @ignore
 */
export const registerAnalysis = (
    state: ToolState,
    args: {
        analysisId: string;
        name: string;
        description?: string;
        outputFormat: AnalysisOutputFormat;
        type?: AnalysisType;
        code: string;
        inputs: MultiInputIds;
        affectedEntryIds: readonly string[];
    },
): void => {
    state.analyses.register({
        analysisId: args.analysisId,
        name: args.name,
        description: args.description,
        outputFormat: args.outputFormat,
        type: args.type,
        code: args.code,
        inputs: args.inputs,
        affectedEntryIds: args.affectedEntryIds,
    });
};

/**
 * Toggle a standing analysis. Enabling alone never replays — it fires no `entries-change`, so the next
 * genuine change to a source entry is what re-runs it. Returns false when the id is unknown.
 *
 * @ignore
 */
export const setStandingEnabled = (state: ToolState, analysisId: string, enabled: boolean): boolean =>
    state.analyses.setEnabled(analysisId, enabled);

// Newest `timestamp` across every resolved source entry, or undefined when none carry one.
const latestTimestamp = (resolved: ResolvedEntries): number | undefined => {
    let latest: number | undefined;
    for (const group of Object.values(resolved)) {
        for (const entry of group) {
            const ts = (entry as { timestamp?: unknown }).timestamp;
            if (typeof ts === 'number' && (latest === undefined || ts > latest)) latest = ts;
        }
    }
    return latest;
};
