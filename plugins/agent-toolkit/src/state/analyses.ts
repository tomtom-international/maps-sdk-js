/**
 * @module agent-toolkit-state
 *
 * The session-level {@link Analyses} registry — the single home for every `analyseData` analysis
 * (one-shot + monitored) across every entry kind. Entries carry no analysis state; per-entry views read
 * results on demand via {@link Analyses.getAnalysesForEntry}. Writers `register` an analysis then
 * `attachResult`; the registry emits `analysis-change` whenever a result lands.
 *
 * One recurrence engine feeds it: the standing sweep (`tools/state/analyses-runtime.ts`, reads
 * {@link Analyses.sweepCandidates}), driven by every input slice's `entries-change`. It replays the
 * sandboxed `analyseData` code so monitored results re-run on source change.
 *
 * Incident clustering is NOT here — it is typed, dedicated state owned by `TrafficIncidentsState`
 * (`clusters`), not a generic analysis.
 *
 * @group Agent Toolkit
 */

import type { AnalysisOutputFormat } from '../tools/shared/sandbox-code';
import { StateEvents } from './events';

/**
 * A single analysis result — the result of an `analyseData` run (one-shot or a `monitorAnalysis`
 * standing replay). `data` is whatever the dynamic code returned. Identical across every entry kind.
 *
 * @group Agent Toolkit
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
 * What an analysis record is FOR — its purpose, not its execution kind (every record is sandbox code).
 * - `'analysis'`: an operator-facing `analyseData` result (the default), surfaced in the Analyses tab
 *   and per-entry detail.
 * - `'tracker-rule'`: a tracker rule's verdict. Recomputes, GC's, and reads by id exactly like an
 *   analysis, but is its own enumerable category so the tracker can list its rules and operator views
 *   can exclude them. Pass it to {@link Analyses.all} / {@link Analyses.getAnalysesForEntry} to filter.
 *
 * @group Agent Toolkit
 */
export type AnalysisType = 'analysis' | 'tracker-rule';

/**
 * The metadata + lifecycle fields shared by {@link AnalysisRecord} and its {@link AnalysisRegistration}
 * input — everything except `enabled` (defaulted on register) and the runtime-built `history`. The
 * single source of truth for an analysis's declared shape, so the registry and its register input never
 * drift.
 *
 * @group Agent Toolkit
 */
export type AnalysisBase = {
    /** Stable handle minted by {@link makeAnalysisId} (name + sorted source ids). */
    analysisId: string;
    name: string;
    description?: string;
    outputFormat: AnalysisOutputFormat;
    /** What this record is for — `'analysis'` (default) or `'tracker-rule'`. See {@link AnalysisType}. */
    type: AnalysisType;
    /** Sandbox code replayed by the standing sweep. */
    code?: string;
    /** Original `analyseData` input descriptor (`MultiInputIds`); opaque here. */
    inputs?: unknown;
    /** Ids of every entry this analysis is attached to. The per-entry lookup key. */
    affectedEntryIds: readonly string[];
};

/**
 * One analysis tracked by the session-level {@link Analyses} registry — the single home for every
 * `analyseData` analysis, one-shot or monitored, across every entry kind. The shared {@link AnalysisBase}
 * plus the registry-owned `enabled` flag and the runtime-built `history`. `affectedEntryIds` is the
 * per-entry lookup key ({@link Analyses.getAnalysesForEntry}); `enabled` means "recomputes on source
 * change". `history` is the bounded result timeline (replaces the old per-entry store); the latest is
 * the current result and is threaded back into the sandbox code as `previous`.
 *
 * @group Agent Toolkit
 */
export type AnalysisRecord = AnalysisBase & {
    /** Whether the standing sweep recomputes it when its source entry changes. */
    enabled: boolean;
    /** Bounded result timeline, oldest first (see {@link MAX_HISTORY_PER_ANALYSIS}). */
    history: EntryAnalysis[];
};

/**
 * {@link Analyses.register} input — the shared {@link AnalysisBase} plus an optional `enabled`
 * (defaulted on register). No `history`; the registry builds that as results land.
 *
 * @group Agent Toolkit
 */
export type AnalysisRegistration = Omit<AnalysisBase, 'type'> & { type?: AnalysisType; enabled?: boolean };

/** Events emitted by {@link Analyses}. One event for "an analysis result was attached or recomputed". */
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
 * Pure storage + lifecycle. The one recurrence engine lives elsewhere: the standing sweep in
 * `tools/state/analyses-runtime.ts` (reads {@link sweepCandidates}), which replays both `sandbox` and
 * `deterministic` records. `_wired` is a one-shot guard the sweep reads so it subscribes to slice
 * events once.
 *
 * @group Agent Toolkit
 */
export class Analyses {
    private readonly _records = new Map<string, AnalysisRecord>();
    private _wired = false;

    /** Subscribe to {@link AnalysesEvents} — fired whenever a result is attached or recomputed. */
    readonly events = new StateEvents<AnalysesEvents>();

    /** True once the tools-layer sweep has subscribed to slice change events. Set via {@link markWired}. */
    get wired(): boolean {
        return this._wired;
    }

    /** Mark the session as wired so {@link wired} guards a repeat subscription. */
    markWired(): void {
        this._wired = true;
    }

    /**
     * Insert or replace a record's metadata + lifecycle (NOT its result — use {@link attachResult} for
     * that). Re-registering an existing `analysisId` preserves its `enabled` flag and result history,
     * UNLESS the sandbox `code` changed — in which case the history is dropped so the new recipe never
     * inherits the old `previous`.
     */
    register(input: AnalysisRegistration): void {
        const existing = this._records.get(input.analysisId);
        const enabled = input.enabled ?? existing?.enabled ?? false;
        const type = input.type ?? existing?.type ?? 'analysis';
        const changed = existing != null && existing.code !== input.code;
        this._records.set(input.analysisId, {
            analysisId: input.analysisId,
            name: input.name,
            description: input.description,
            outputFormat: input.outputFormat,
            type,
            code: input.code,
            inputs: input.inputs,
            affectedEntryIds: input.affectedEntryIds,
            enabled,
            history: changed || !existing ? [] : existing.history,
        });
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
    getAnalysesForEntry(entryId: string, type?: AnalysisType): readonly EntryAnalysis[] {
        const out: EntryAnalysis[] = [];
        for (const record of this._records.values()) {
            if (type !== undefined && record.type !== type) continue;
            if (!record.affectedEntryIds.includes(entryId)) continue;
            const latest = record.history.at(-1);
            if (latest) out.push(latest);
        }
        return out;
    }

    /**
     * Every analysis record, in registration order — the combined, cross-entry view. Pass a
     * {@link AnalysisType} to restrict to one category (`'analysis'` for the operator-facing set,
     * `'tracker-rule'` for tracker verdicts); omit it for every record. Read `record.history.at(-1)`
     * for each one's latest result.
     */
    all(type?: AnalysisType): readonly AnalysisRecord[] {
        const records = [...this._records.values()];
        return type === undefined ? records : records.filter((r) => r.type === type);
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

    /** Flip an analysis on/off. Returns false when the id is unknown. */
    setEnabled(analysisId: string, enabled: boolean): boolean {
        const record = this._records.get(analysisId);
        if (!record) return false;
        record.enabled = enabled;
        return true;
    }

    /** Every enabled record, in registration order — the standing sweep's replay candidates. */
    sweepCandidates(): AnalysisRecord[] {
        return [...this._records.values()].filter((r) => r.enabled);
    }

    remove(analysisId: string): void {
        this._records.delete(analysisId);
    }

    /**
     * Remove every record sharing a `name`, across all source entries. Mirrors the old per-entry
     * `unregister(name)` which dropped a named analysis wherever it was attached.
     */
    removeByName(name: string): void {
        for (const [id, record] of this._records) if (record.name === name) this._records.delete(id);
    }

    /**
     * Drop every record whose source entries are ALL gone — the single GC path now that entries no
     * longer hold their analyses. The sweep wiring calls this on each `entries-change` with the live
     * source-entry ids, so a removed entry's records are collected on the next change. A record over
     * `[A, B]` survives while either is live (its `affectedEntryIds` keeps the dead id, which is
     * harmless — nothing queries it).
     */
    pruneToLiveEntries(liveIds: ReadonlySet<string>): void {
        for (const [id, record] of this._records) {
            if (!record.affectedEntryIds.some((entryId) => liveIds.has(entryId))) this._records.delete(id);
        }
    }

    /** Drop every record. Walked automatically by `destroyState` (duck-typed `reset`). */
    reset(): void {
        this._records.clear();
    }
}
