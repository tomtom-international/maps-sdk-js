/**
 * @module agent-toolkit-state
 */

import type { TrafficIncident } from '@tomtom-org/maps-sdk/core';
import * as turf from '@turf/turf';
import * as h3 from 'h3-js';
import { AnalysisOutputFormat, runSandboxedFn, validateAnalysisResult } from '../../tools/shared';

/**
 * A single aggregation/analysis result attached to a traffic-incidents entry.
 * Produced by `analyseData` (one-shot or `monitor`-rerun); `data` is whatever the dynamic code returned.
 *
 * @group Agent Toolkit
 */
export type IncidentsAnalysis = {
    /** Unique name within the parent entry (used as a key for future UI). */
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
 * A registered, re-executing analysis. Produced by `analyseData` with `monitor: { entryId }`;
 * replayed by an entry's {@link IncidentsAnalyses} on every monitor-tick of its source.
 *
 * @group Agent Toolkit
 */
export type IncidentsAnalysisSpec = {
    name: string;
    description?: string;
    outputFormat: AnalysisOutputFormat;
    code: string;
    /** Source entry id the spec reads from. */
    source: string;
};

/**
 * A deterministic analysis spec — a re-executing analysis whose logic is a
 * caller-supplied {@link run} callback rather than sandboxed user code. The
 * generic seam any persona/customer registers against (e.g. the traffic
 * example's incident clustering); the toolkit stays agnostic about what `run`
 * computes. Replayed by {@link IncidentsAnalyses} on every monitor-tick of its
 * source, with the previous result threaded back in for trend continuity.
 *
 * @group Agent Toolkit
 */
export type DeterministicSpec = {
    name: string;
    /** Source entry id the spec reads from. */
    source: string;
    /**
     * Stable key of the registrant's parameters. When it changes on
     * re-register, the spec's result history is dropped (the new parameters
     * describe a different analysis); when it is unchanged, history is
     * preserved so the callback's trend window survives.
     */
    signature?: string;
    /**
     * Compute a result from the current incidents. `previous` is this spec's
     * last result (undefined on first run); `sampledAt` is the canonical moment
     * the data is from; `previousSampledAt` is the moment `previous` was sampled
     * (undefined on first run). A `run` advancing a rolling window keys it on the
     * moment, not the call: append when `sampledAt > previousSampledAt`, replace
     * otherwise — so a re-run of an unchanged snapshot (ID-stability re-read)
     * doesn't double-count. Sync or async.
     */
    run: (
        data: TrafficIncident[],
        ctx: { previous: unknown; sampledAt: number; previousSampledAt?: number },
    ) => unknown | Promise<unknown>;
};

/**
 * Union of all supported analysis spec types. Code specs run sandboxed
 * JavaScript; deterministic specs run a caller-supplied {@link DeterministicSpec.run}
 * callback.
 *
 * @group Agent Toolkit
 */
export type AnyAnalysisSpec = IncidentsAnalysisSpec | DeterministicSpec;

/**
 * Run a one-shot incidents analysis spec against an incidents snapshot. Used by
 * `analyseData`'s `monitor` path for the initial result and by {@link IncidentsAnalyses}
 * for each replay tick.
 *
 * `sampledAt` is the canonical moment the data is from — it becomes the sandbox's
 * `now` so user code computing deltas/rates against `previous` sees a consistent
 * time axis across the tick that produced both this result and the entry data.
 *
 * Composes `runSandboxedFn` (compile + execute) with `validateAnalysisResult`
 * (JSON-normalize, undefined-check, chart-shape-check) so both call sites share
 * the same contract — including the `toJsonSafe` round-trip that prevents
 * `NaN` / sparse-array values from poisoning the next AI SDK turn.
 */
export const runIncidentSpec = async (
    spec: IncidentsAnalysisSpec,
    incidents: TrafficIncident[],
    previous: unknown,
    sampledAt: number,
): Promise<{ value: unknown } | { error: string }> => {
    const sandbox = await runSandboxedFn(
        spec.code,
        ['incidents', 'h3', 'turf', 'now', 'log', 'previous'],
        [incidents, h3, turf, new Date(sampledAt), () => {}, previous],
        'Analysis',
    );
    if ('error' in sandbox) return { error: sandbox.error };
    return validateAnalysisResult(sandbox.value, spec.outputFormat);
};

/**
 * Maximum number of historical results retained per analysis name. Older entries
 * are evicted as new ones land. At a 60s monitor tick this is ~4 hours of trend
 * data — enough for a chart, bounded for memory.
 */
export const MAX_HISTORY_PER_ANALYSIS = 240;

/**
 * Per-entry analysis registry: owns re-executing specs *and* the timeline of
 * their results. One thing, three parts — name, recipe (spec), output history —
 * kept together instead of split across sibling fields.
 *
 * Each named analysis keeps a bounded chronological history (see
 * {@link MAX_HISTORY_PER_ANALYSIS}) so consumers can trend results over time;
 * `getResult(name)` returns the most recent, `history(name)` the full timeline.
 *
 * Errors from individual specs are dropped silently — replay should never break
 * the monitor tick that triggered it.
 *
 * @group Agent Toolkit
 */
export class IncidentsAnalyses {
    private _specs: AnyAnalysisSpec[] = [];
    private readonly _historyByName = new Map<string, IncidentsAnalysis[]>();

    get specs(): readonly AnyAnalysisSpec[] {
        return this._specs;
    }

    /**
     * Latest result for each registered spec, in registration order. Specs whose
     * history is empty (e.g. only failed runs) are skipped. UI layers that "render
     * whatever analyses this entry has" should iterate this instead of poking at
     * private history state.
     */
    get results(): readonly IncidentsAnalysis[] {
        const out: IncidentsAnalysis[] = [];
        for (const spec of this._specs) {
            const latest = this.getResult(spec.name);
            if (latest) out.push(latest);
        }
        return out;
    }

    /** Full timeline for a single named analysis, oldest first. Empty when unknown. */
    history(name: string): readonly IncidentsAnalysis[] {
        return this._historyByName.get(name) ?? [];
    }

    /** Most recent result for a given analysis name, or undefined. */
    getResult(name: string): IncidentsAnalysis | undefined {
        const history = this._historyByName.get(name);
        return history?.at(-1);
    }

    /**
     * Register a spec, or replace an existing one with the same name. When the new spec
     * differs from the existing one (code, outputFormat, or description), drops history
     * for that name — old results belong to a different analysis and must not leak into
     * `getResult` / `results`, which describe the *current* spec. Identical re-registers
     * are no-ops and preserve history (so trend continuity survives idempotent retries).
     */
    register(spec: IncidentsAnalysisSpec): void {
        const idx = this._specs.findIndex((s) => s.name === spec.name);
        if (idx >= 0) {
            const existing = this._specs[idx];
            const isCodeSpec = !('run' in existing);
            const materiallyChanged =
                !isCodeSpec ||
                (existing as IncidentsAnalysisSpec).code !== spec.code ||
                (existing as IncidentsAnalysisSpec).outputFormat !== spec.outputFormat ||
                (existing as IncidentsAnalysisSpec).description !== spec.description;
            this._specs[idx] = spec;
            if (materiallyChanged) this._historyByName.delete(spec.name);
        } else {
            this._specs.push(spec);
        }
    }

    /**
     * Register a deterministic spec, or replace an existing one with the same name.
     * Drops history when the new spec differs materially — replacing a code spec, or
     * a changed {@link DeterministicSpec.signature} (its parameters describe a
     * different analysis). An unchanged signature preserves history so the
     * callback's trend window survives idempotent re-registers.
     */
    registerDeterministic(spec: DeterministicSpec): void {
        const idx = this._specs.findIndex((s) => s.name === spec.name);
        if (idx >= 0) {
            const existing = this._specs[idx];
            // A missing signature can't certify "same analysis", so treat it as
            // materially changed — never let a new unsigned spec inherit a prior
            // (possibly wrong-shaped) result as its `previous`.
            const materiallyChanged =
                !('run' in existing) || spec.signature == null || existing.signature !== spec.signature;
            this._specs[idx] = spec;
            if (materiallyChanged) this._historyByName.delete(spec.name);
        } else {
            this._specs.push(spec);
        }
    }

    /**
     * Forget a spec by name — drops both the spec *and* its result history. No-op
     * when unknown. History must go too: consumers read latest results via the
     * history-backed `getResult`, so a preserved history would resurrect a
     * "removed" analysis on the next read.
     */
    unregister(name: string): void {
        this._specs = this._specs.filter((s) => s.name !== name);
        this._historyByName.delete(name);
    }

    /**
     * Append a result to the timeline for its name, evicting the oldest entry
     * when the per-name cap is hit. Used by the slice for one-shot tool runs and
     * by {@link replay} for each fresh tick.
     */
    attach(result: IncidentsAnalysis): void {
        let history = this._historyByName.get(result.name);
        if (!history) {
            history = [];
            this._historyByName.set(result.name, history);
        }
        // One result per moment: a same-timestamp re-run (e.g. an ID-stability
        // re-cluster of an unchanged snapshot) overwrites rather than duplicating.
        const last = history[history.length - 1];
        if (last && last.timestamp === result.timestamp) {
            history[history.length - 1] = result;
            return;
        }
        history.push(result);
        if (history.length > MAX_HISTORY_PER_ANALYSIS) history.shift();
    }

    /**
     * Re-run every registered spec against `data`, threading the previous result
     * from the timeline. `sampledAt` is the canonical moment for this replay —
     * shared with the entry data and the sandbox's `now`, so consumers can join
     * across them safely. Each fresh result is appended before being returned.
     * Failed specs are skipped.
     */
    async replay(data: TrafficIncident[], sampledAt: number): Promise<IncidentsAnalysis[]> {
        const out: IncidentsAnalysis[] = [];
        for (const spec of this._specs) {
            if ('run' in spec) {
                // Deterministic spec — run the caller-supplied callback, threading
                // the previous result. A throwing callback is skipped so one bad
                // spec never breaks the tick that triggered the replay.
                try {
                    const prev = this.getResult(spec.name);
                    const data2 = await spec.run(data, {
                        previous: prev?.data,
                        sampledAt,
                        previousSampledAt: prev?.timestamp,
                    });
                    const fresh: IncidentsAnalysis = {
                        name: spec.name,
                        timestamp: sampledAt,
                        outputFormat: 'json',
                        data: data2,
                    };
                    this.attach(fresh);
                    out.push(fresh);
                } catch {
                    // skip — replay must never break the monitor tick
                }
            } else {
                // Code spec — run sandboxed code
                const codeSpec = spec as IncidentsAnalysisSpec;
                const result = await runIncidentSpec(codeSpec, data, this.getResult(codeSpec.name)?.data, sampledAt);
                if ('error' in result) continue;
                const fresh: IncidentsAnalysis = {
                    name: codeSpec.name,
                    timestamp: sampledAt,
                    ...(codeSpec.description && { description: codeSpec.description }),
                    outputFormat: codeSpec.outputFormat,
                    data: result.value,
                };
                this.attach(fresh);
                out.push(fresh);
            }
        }
        return out;
    }
}
