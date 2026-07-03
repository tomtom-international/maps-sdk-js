/**
 * @module agent-toolkit-state
 *
 * The session-level {@link Analyses} registry — the single home for every `analyseData` analysis
 * (one-shot + monitored) across every entry kind. Entries carry no analysis state; per-entry views read
 * results on demand via {@link Analyses.getAnalysesForEntry}. Writers `register` an analysis then
 * `attachResult`; the registry emits `analysis-change` whenever a result lands.
 *
 * It is a pure sink: it holds each analysis's metadata + bounded result `history`, but NOT its recipe
 * or recurrence. A monitored analysis's recipe lives on a {@link Job} the tools layer registers with the
 * {@link JobEngine}; the registry keeps the returned handle in `_jobs` (keyed by `analysisId`) so it can
 * pause/resume it or compare its `code` on re-arm. The job's `run` writes results back here via
 * {@link attachResult}. A one-shot analysis keeps a paused job (its recipe), so `monitorAnalysis` can
 * promote it later without re-declaring the code.
 *
 * Incident clustering is NOT here — it is typed, dedicated state owned by `TrafficIncidentsState`
 * (`clusters`), not a generic analysis.
 *
 * @group Agent Toolkit
 */

import type { Job } from '../engine';
import type { AnalysisOutputFormat } from '../tools/shared/sandbox-code';
import { StateEvents } from './events';

/**
 * A single analysis result — the result of an `analyseData` run (one-shot or a `monitorAnalysis`
 * standing replay). `data` is whatever the dynamic code returned. Identical across every entry kind.
 *
 * @group Agent Toolkit
 *
 * @ignore
 */
export type EntryAnalysis = {
    /** Unique name within the parent entry — used as the key (re-attaching the same name replaces). */
    name: string;
    timestamp: number;
    /** Optional human-readable description of what the analysis computed. */
    description?: string;
    /** How `data` should be interpreted — plain JSON or a Chart.js configuration. */
    outputFormat: AnalysisOutputFormat;
    /** Arbitrary aggregation result returned by the dynamic code. */
    data: unknown;
};

/**
 * Maximum number of historical results retained per analysis name. Older entries are evicted as new
 * ones land. At a 60s monitor tick this is ~4 hours of trend data — enough for a chart, bounded for
 * memory.
 *
 * @group Agent Toolkit
 */
export const MAX_HISTORY_PER_ANALYSIS = 240;

/**
 * Stable analysis handle: an analysis's `name` plus the sorted ids of every entry it is attached to.
 * An identical re-run (same name + same sources) yields the same id, so monitoring and result history
 * survive the re-run. Lives here (state layer) so both the slices and the tools-layer runtime can mint
 * ids without the state layer importing `tools/`.
 *
 * @group Agent Toolkit
 */
export const makeAnalysisId = (name: string, affectedIds: readonly string[]): string =>
    `${name}::${[...affectedIds].sort((a, b) => a.localeCompare(b)).join(',')}`;

/**
 * One analysis tracked by the session-level {@link Analyses} registry — the single home for every
 * `analyseData` analysis, one-shot or monitored, across every entry kind. Pure sink state: metadata plus
 * the bounded result `history`. The recipe (`code` / `inputs`) and recurrence are NOT here — they live on
 * the analysis's {@link Job} (see `_jobs`). `affectedEntryIds` is the per-entry lookup key
 * ({@link Analyses.getAnalysesForEntry}); `history` is the result timeline (oldest first), whose latest
 * is the current result and is threaded back into the sandbox code as `previous`.
 *
 * @group Agent Toolkit
 */
export type AnalysisRecord = {
    /** Stable handle minted by {@link makeAnalysisId} (name + sorted source ids). */
    analysisId: string;
    name: string;
    description?: string;
    outputFormat: AnalysisOutputFormat;
    /** Ids of every entry this analysis is attached to. The per-entry lookup key. */
    affectedEntryIds: readonly string[];
    /** Bounded result timeline, oldest first (see {@link MAX_HISTORY_PER_ANALYSIS}). */
    history: EntryAnalysis[];
};

/**
 * {@link Analyses.register} input — the record's metadata. No `history` (the registry builds that as
 * results land) and no recipe (that lives on the {@link Job}).
 *
 * @group Agent Toolkit
 */
export type AnalysisRegistration = Omit<AnalysisRecord, 'history'>;

/**
 * Events emitted by {@link Analyses}. One event for "an analysis result was attached or recomputed".
 *
 * @ignore
 */
export type AnalysesEvents = {
    /**
     * An analysis result landed (one-shot attach or a recompute). Carries the `analysisId` and the ids
     * of every entry it touches — a per-entry consumer filters with `affectedEntryIds.includes(id)`.
     */
    'analysis-change': { analysisId: string; affectedEntryIds: readonly string[] };
};

/**
 * Session-level registry of EVERY analysis — the single source of truth that replaces the per-entry
 * `_analyses` stores. Holds one {@link AnalysisRecord} per analysis (keyed by `analysisId`), each with
 * its own bounded result history. Entries carry no analysis state; per-entry views call
 * {@link getAnalysesForEntry}. Held on `ToolState` as `state.analyses`.
 *
 * Pure sink: metadata + result history only. The recurrence lives on the {@link JobEngine}; this
 * registry keeps each monitored analysis's {@link Job} handle in `_jobs` (keyed by `analysisId`) so it
 * can pause/resume it ({@link job}) or compare its `code` on re-arm. A one-shot analysis keeps a paused
 * job for later promotion.
 *
 * @group Agent Toolkit
 */
export class Analyses {
    private readonly _records = new Map<string, AnalysisRecord>();
    /** analysisId → the {@link Job} backing it (one-shot = paused). The reference linking record to engine. */
    private readonly _jobs = new Map<string, Job>();

    /** Subscribe to {@link AnalysesEvents} — fired whenever a result is attached or recomputed. */
    readonly events = new StateEvents<AnalysesEvents>();

    /**
     * Insert or replace a record's metadata (NOT its result — use {@link attachResult}; nor its recipe —
     * that lives on the {@link Job}). Re-registering an existing `analysisId` preserves its result
     * history; callers drop stale history explicitly via {@link resetHistory} when the recipe changes.
     */
    register(input: AnalysisRegistration): void {
        const existing = this._records.get(input.analysisId);
        this._records.set(input.analysisId, {
            analysisId: input.analysisId,
            name: input.name,
            description: input.description,
            outputFormat: input.outputFormat,
            affectedEntryIds: input.affectedEntryIds,
            history: existing?.history ?? [],
        });
    }

    /** Store the {@link Job} backing an analysis — the reference linking this record to the engine. */
    setJob(analysisId: string, job: Job): void {
        this._jobs.set(analysisId, job);
    }

    /** The {@link Job} backing an analysis, if monitored or a retained one-shot. */
    job(analysisId: string): Job | undefined {
        return this._jobs.get(analysisId);
    }

    /** Drop an analysis's result history — called on re-arm when the recipe changed (stale `previous`). */
    resetHistory(analysisId: string): void {
        const record = this._records.get(analysisId);
        if (record) record.history = [];
    }

    /**
     * Append a result to a record's timeline, evicting the oldest when the per-analysis cap is hit. A
     * same-timestamp re-run (an id-stability re-read of an unchanged snapshot) overwrites the last entry
     * rather than duplicating it. No-op (no emit) when the `analysisId` is unknown. Emits `analysis-change`.
     */
    attachResult(analysisId: string, result: EntryAnalysis): void {
        const record = this._records.get(analysisId);
        if (!record) return;
        const last = record.history.at(-1);
        if (last?.timestamp === result.timestamp) {
            record.history[record.history.length - 1] = result;
        } else {
            record.history.push(result);
            if (record.history.length > MAX_HISTORY_PER_ANALYSIS) record.history.shift();
        }
        this.events.emit('analysis-change', { analysisId, affectedEntryIds: record.affectedEntryIds });
    }

    /**
     * Latest result of every analysis attached to `entryId`, in registration order. The on-demand
     * replacement for the old per-entry `_analyses.results`. Linear scan over records — fine at session
     * scale (one record per distinct analyseData name+sources, plus one per clustered incidents entry).
     */
    getAnalysesForEntry(entryId: string): readonly EntryAnalysis[] {
        const out: EntryAnalysis[] = [];
        for (const record of this._records.values()) {
            if (!record.affectedEntryIds.includes(entryId)) continue;
            const latest = record.history.at(-1);
            if (latest) out.push(latest);
        }
        return out;
    }

    /**
     * Every analysis record, in registration order — the combined, cross-entry view. Read
     * `record.history.at(-1)` for each one's latest result. (Tracker verdicts are no longer analyses, so
     * every record here is operator-facing.)
     */
    all(): readonly AnalysisRecord[] {
        return [...this._records.values()];
    }

    /** Full result timeline for one analysis, oldest first. Empty when unknown. */
    history(analysisId: string): readonly EntryAnalysis[] {
        return this._records.get(analysisId)?.history ?? [];
    }

    /** Latest result data threaded into the next replay as `previous`, or undefined. */
    lastResult(analysisId: string): unknown {
        return this._records.get(analysisId)?.history.at(-1)?.data;
    }

    get(analysisId: string): AnalysisRecord | undefined {
        return this._records.get(analysisId);
    }

    /** Whether the analysis is currently recomputed on source change (its job exists and is active). */
    isMonitored(analysisId: string): boolean {
        return this._jobs.get(analysisId)?.active ?? false;
    }

    /** Remove an analysis: tear down its job and drop the record + handle. */
    remove(analysisId: string): void {
        this._jobs.get(analysisId)?.unregister();
        this._jobs.delete(analysisId);
        this._records.delete(analysisId);
    }

    /**
     * Remove every record sharing a `name`, across all source entries. Mirrors the old per-entry
     * `unregister(name)` which dropped a named analysis wherever it was attached.
     */
    removeByName(name: string): void {
        for (const [id, record] of this._records) if (record.name === name) this.remove(id);
    }

    /** Drop every record + job handle. Walked automatically by `destroyState` (duck-typed `reset`). */
    reset(): void {
        for (const job of this._jobs.values()) job.unregister();
        this._jobs.clear();
        this._records.clear();
    }
}
