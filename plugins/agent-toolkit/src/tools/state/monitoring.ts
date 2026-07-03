/**
 * @module agent-toolkit-tools
 *
 * Job builders — the tools-layer half of monitoring. They construct the `run` closure for a standing
 * computation (prepare the multi-kind inputs → run sandbox `code` → write the result to its sink) and
 * register it as a job on {@link JobEngine}. They live here, not in the state layer, because building
 * `run` needs `prepareMultiInputs` + `runPreparedSandbox` (tools-layer). The engine never sees any of
 * that — it only ever calls the opaque `run`.
 *
 * Two sinks:
 * - {@link registerAnalysisJob}: an `analyseData` analysis. `run` re-runs the code and `attachResult`s to
 *   {@link Analyses}. Registered active when monitored, paused otherwise (a one-shot keeps its recipe so
 *   {@link setAnalysisMonitored} can promote it without re-declaring the code).
 * - {@link registerTrackerJob}: a tracker rule. `run` re-runs the code and feeds the {@link Verdict} to
 *   {@link EventsState.ingestVerdict}, which applies the rising-edge reducer. Always active.
 *
 * Incident clustering does NOT ride this — it is dedicated, typed `TrafficIncidentsState` (`clusters`)
 * re-run from `tools/state/clusters-runtime.ts`.
 */

import type { Job } from '../../engine';
import { isVerdict } from '../../state';
import type { ToolState } from '../../types';
import { type AnalysisOutputFormat, latestTimestamp, type MultiInputIds, prepareMultiInputs } from '../shared';
import { runPreparedSandbox } from '../shared/sandbox-replay';

/**
 * Register (or re-arm) an `analyseData` analysis as a job. Drops stale history when the recipe changed
 * (so the new code never inherits the old `previous`) and preserves the prior monitoring state on re-arm.
 * The job is `active` when monitored; a one-shot is registered paused so it retains its recipe.
 *
 * @ignore
 */
export const registerAnalysisJob = (
    state: ToolState,
    args: {
        analysisId: string;
        name: string;
        description?: string;
        outputFormat: AnalysisOutputFormat;
        code: string;
        inputs: MultiInputIds;
        affectedEntryIds: readonly string[];
        monitor: boolean;
    },
): void => {
    const registerRecord = () =>
        state.analyses.register({
            analysisId: args.analysisId,
            name: args.name,
            description: args.description,
            outputFormat: args.outputFormat,
            affectedEntryIds: args.affectedEntryIds,
        });

    const existing = state.analyses.job(args.analysisId);
    // Idempotent re-run with the same recipe: keep the existing job (and any in-flight sweep + history),
    // just refresh metadata and (re-)activate if monitoring. Avoids tearing a job down mid-sweep.
    if (existing && existing.code === args.code) {
        registerRecord();
        if (args.monitor) existing.setActive(true);
        return;
    }

    // First arm, or the recipe changed: drop stale history (the new code must not inherit the old
    // `previous`), retire the old job, build a fresh one.
    if (existing) state.analyses.resetHistory(args.analysisId);
    const active = args.monitor || (existing?.active ?? false);
    existing?.unregister();
    registerRecord();

    // `job` is captured so `run` can confirm it is STILL the analysis's registered job before attaching:
    // a re-arm with changed code retires this job and registers a new one, and an in-flight sweep of the
    // old job must not write a stale-code result into the new recipe's freshly-reset history.
    let job: Job;
    // Re-run against fresh state. Re-reads the record (it may have been GC'd mid-sweep), re-prepares the
    // merged inputs, runs the stored code, attaches the result. Bails on any soft failure — a vanished
    // source entry, a sandbox throw, or an invalid result must never break the change that triggered it.
    const run = async (): Promise<void> => {
        if (!state.analyses.get(args.analysisId)) return;
        const prepared = await prepareMultiInputs(args.inputs, state);
        if ('error' in prepared) return;
        const sampledAt = latestTimestamp(prepared.value.resolved) ?? Date.now();
        const result = await runPreparedSandbox(state, prepared.value, {
            code: args.code,
            previous: state.analyses.lastResult(args.analysisId),
            sampledAt,
            outputFormat: args.outputFormat,
        });
        // Superseded by a re-arm while we awaited the sandbox? Drop this stale result.
        if ('error' in result || state.analyses.job(args.analysisId) !== job) return;
        state.analyses.attachResult(args.analysisId, {
            name: args.name,
            ...(args.description && { description: args.description }),
            outputFormat: args.outputFormat,
            data: result.value,
            timestamp: sampledAt,
        });
    };

    job = state.engine.register({
        affectedEntryIds: args.affectedEntryIds,
        code: args.code,
        active,
        run,
        onOrphaned: () => state.analyses.remove(args.analysisId),
    });
    state.analyses.setJob(args.analysisId, job);
};

/**
 * Toggle monitoring on an existing analysis by activating/pausing its job. Returns false when the id is
 * unknown (no job). Activating alone never replays — the next genuine source change re-runs it.
 *
 * @ignore
 */
export const setAnalysisMonitored = (state: ToolState, analysisId: string, monitor: boolean): boolean => {
    const job = state.analyses.job(analysisId);
    if (!job) return false;
    job.setActive(monitor);
    return true;
};

/**
 * Register a tracker rule as a job. `run` re-runs the rule and feeds each fresh {@link Verdict} to the
 * rising-edge reducer. Always active (a paused tracker pauses its job via {@link EventsState.setEnabled}).
 *
 * @ignore
 */
export const registerTrackerJob = (
    state: ToolState,
    args: { trackerId: string; code: string; inputs: MultiInputIds; affectedEntryIds: readonly string[] },
): void => {
    const run = async (): Promise<void> => {
        const prepared = await prepareMultiInputs(args.inputs, state);
        if ('error' in prepared) return;
        const sampledAt = latestTimestamp(prepared.value.resolved) ?? Date.now();
        // Tracker rules read the current snapshot only (no `previous`), matching their arm-time dry-run.
        const result = await runPreparedSandbox(state, prepared.value, {
            code: args.code,
            previous: undefined,
            sampledAt,
            outputFormat: 'json',
        });
        if ('error' in result || !isVerdict(result.value)) return;
        state.trackers.ingestVerdict(args.trackerId, result.value, sampledAt);
    };

    const job = state.engine.register({
        affectedEntryIds: args.affectedEntryIds,
        code: args.code,
        active: true,
        run,
        onOrphaned: () => state.trackers.unregister(args.trackerId),
    });
    state.trackers.setJob(args.trackerId, job);
};
