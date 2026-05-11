/**
 * @module agent-toolkit-state
 */

import type { TrafficIncident } from '@tomtom-org/maps-sdk/core';
import * as turf from '@turf/turf';
import * as h3 from 'h3-js';
import { AnalysisOutputFormat, runSandboxedFn, validateAnalysisResult } from '../../tools/shared';

/**
 * A single aggregation/analysis result attached to a traffic-incidents entry.
 * Produced by the `analyseIncidents` tool; `data` is whatever the dynamic code returned.
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
 * A registered, re-executing analysis. Produced by `analyseIncidents`; replayed by
 * an entry's {@link IncidentsAnalyses} on every monitor-tick of its source.
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
 * Run a one-shot incidents analysis spec against an incidents snapshot. Used by
 * `analyseIncidents` for the initial result and by {@link IncidentsAnalyses}
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
    private _specs: IncidentsAnalysisSpec[] = [];
    private readonly _historyByName = new Map<string, IncidentsAnalysis[]>();

    get specs(): readonly IncidentsAnalysisSpec[] {
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
            const materiallyChanged =
                existing.code !== spec.code ||
                existing.outputFormat !== spec.outputFormat ||
                existing.description !== spec.description;
            this._specs[idx] = spec;
            if (materiallyChanged) this._historyByName.delete(spec.name);
        } else {
            this._specs.push(spec);
        }
    }

    /** Drop a spec by name. No-op when unknown. Result history is preserved. */
    unregister(name: string): void {
        this._specs = this._specs.filter((s) => s.name !== name);
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
            const result = await runIncidentSpec(spec, data, this.getResult(spec.name)?.data, sampledAt);
            if ('error' in result) continue;
            const fresh: IncidentsAnalysis = {
                name: spec.name,
                timestamp: sampledAt,
                ...(spec.description && { description: spec.description }),
                outputFormat: spec.outputFormat,
                data: result.value,
            };
            this.attach(fresh);
            out.push(fresh);
        }
        return out;
    }
}
