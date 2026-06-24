/**
 * @module agent-toolkit-state
 *
 * The {@link TrackerState} slice — generic trackers over toolkit state. A tracker is a thin, stateful
 * layer on top of the {@link Analyses} registry: it IS one rule, compiled to a `type: 'tracker-rule'`
 * analysis whose result is a {@link Verdict}, recomputed by the registry's standing sweep whenever its
 * source entries change. The rule's INPUTS are not stored here — they are the analysis's
 * `affectedEntryIds` (single source of truth; a rule reads one or more entry kinds, e.g. hospitals +
 * incidents). This slice owns only what the registry can't: the analysis→tracker mapping, one bit of
 * rising-edge memory (`wasActive`), and the durable {@link TrackerEvent} log the UI renders.
 *
 * It computes nothing itself. It subscribes to `analysis-change` and runs a pure rising-edge reducer:
 * a verdict flipping `false→true` logs an `opened` alert, `true→false` logs a `resolved` event. There
 * is no episode state machine, escalation, or resolve-hysteresis: a jittery feed can therefore produce
 * open/resolve churn.
 *
 * @group Agent Toolkit
 */

import type { StateSlice } from '../types/state';
import type { Analyses } from './analyses';
import { StateEvents } from './events';

/**
 * The features within ONE source entry that matched the rule — the per-entry unit of a {@link Verdict}.
 * `featureIds` is the matched SUBSET, not the whole entry: a rule selects features by arbitrary sandbox
 * logic (proximity, threshold, filter), and that selection isn't recoverable from `entryId` alone (the
 * entry holds every feature) without re-running the rule — so the verdict records exactly what matched.
 * These are the features the UI highlights and the `summary` cites.
 */
export type MemberRef = { entryId: string; featureIds: string[] };

/**
 * What a tracker's sandboxed `evaluateCode` returns — stored verbatim as the rule analysis's `data`
 * and read back by the reducer. `members` groups matches by source entry so a verdict can span
 * multiple entry kinds (e.g. "an incident within 100m of a hospital" returns a hospitals group and an
 * incidents group). `summary` is a grounded headline the code produces deterministically.
 */
export type Verdict = {
    active: boolean;
    members: MemberRef[];
    summary: string;
};

/** Toast-worthy (`alert`) vs quietly-logged (`event`). One store; the type discriminates. */
export type TrackerEventType = 'alert' | 'event';
/** Rising edge (`opened`) vs falling edge (`resolved`). The only two statuses in the rising-edge model. */
export type TrackerEventStatus = 'opened' | 'resolved';

/** One thing that happened — a tracker crossing an edge. The durable record the feed + toasts render. */
export type TrackerEvent = {
    id: string;
    /** Source-data sample time of the recompute that fired it (NOT wall-clock). */
    at: number;
    trackerId: string;
    trackerName: string;
    type: TrackerEventType;
    kind: TrackerEventStatus;
    summary: string;
    members: MemberRef[];
    /** Rising-edge time of the episode this closes — present on `resolved`. */
    openedAt?: number;
};

/**
 * One tracker = one rule: an NL condition compiled to a `tracker-rule` analysis, plus its rising-edge
 * state. Inputs are NOT stored — read `analyses.get(analysisId)?.affectedEntryIds` for the entries the
 * rule watches, and a verdict's `members` for the ones that matched.
 */
export type Tracker = {
    id: string;
    name: string;
    /** Natural-language condition (LLM-readable); the compiled code lives on the analysis record. */
    rule: string;
    /** The `type: 'tracker-rule'` analysis whose `data` is this tracker's {@link Verdict}. */
    analysisId: string;
    enabled: boolean;
    /** The one bit of memory: was the verdict active at the last recompute (rising-edge detection). */
    wasActive: boolean;
    /** Rising-edge time of the current open episode, if active. */
    openedAt?: number;
};

/** Events emitted by {@link TrackerState}. */
export type TrackerStateEvents = {
    /** The tracker set or a tracker's live state changed (create / clear / enable / edge crossed). */
    'trackers-change': readonly Tracker[];
    /** A tracker crossed an edge — the freshly-logged event (drives toasts + feed append). */
    'tracker-event': TrackerEvent;
};

/** Max retained events PER tracker — its oldest is evicted past this. One noisy tracker can't starve
 * another's history out of the shared log. */
export const MAX_TRACKER_EVENTS = 200;

/**
 * Generic tracker store + rising-edge reducer. Held on `ToolState` as `state.trackers`. Pure
 * storage + reaction: tools register/unregister trackers and register their rule analyses in
 * {@link Analyses}; this slice maps analysis → tracker and reacts to `analysis-change`.
 *
 * @group Agent Toolkit
 */
export class TrackerState implements StateSlice {
    private readonly _trackers = new Map<string, Tracker>();
    private readonly _log: TrackerEvent[] = [];
    /** analysisId → tracker id, so the reducer ignores non-tracker analyses in O(1). */
    private readonly _trackerByAnalysis = new Map<string, string>();
    private _seq = 0;

    readonly events = new StateEvents<TrackerStateEvents>();

    /**
     * Subscribe the rising-edge reducer to the analyses registry for the slice's lifetime. The
     * subscription is never torn down (it no-ops without trackers); `reset()` only clears data.
     */
    constructor(private readonly analyses: Analyses) {
        analyses.events.on('analysis-change', ({ analysisId }) => this.onAnalysisChange(analysisId));
    }

    /**
     * Register a tracker and index its analysis. The caller (createTracker) registers it with the
     * rising-edge bit clear (`wasActive: false`) and attaches the arm-time verdict AFTER this call, so a
     * condition already live at creation crosses false→true through the reducer and fires one `opened`
     * alert. Emits `trackers-change`.
     */
    register(tracker: Tracker): void {
        this._trackers.set(tracker.id, tracker);
        this._trackerByAnalysis.set(tracker.analysisId, tracker.id);
        this.emitTrackers();
    }

    /** Remove a tracker and drop its analysis index entry. Returns the analysis id it freed, if any. */
    unregister(trackerId: string): string | undefined {
        const tracker = this._trackers.get(trackerId);
        if (!tracker) return undefined;
        this._trackerByAnalysis.delete(tracker.analysisId);
        this._trackers.delete(trackerId);
        this.emitTrackers();
        return tracker.analysisId;
    }

    /** Pause/resume a tracker. A paused tracker never crosses edges. Emits `trackers-change`. */
    setEnabled(trackerId: string, enabled: boolean): boolean {
        const tracker = this._trackers.get(trackerId);
        if (!tracker) return false;
        tracker.enabled = enabled;
        this.emitTrackers();
        return true;
    }

    /** Live trackers, as copies so external mutation can't corrupt the store. */
    get trackers(): readonly Tracker[] {
        return [...this._trackers.values()].map((t) => ({ ...t }));
    }

    get(trackerId: string): Tracker | undefined {
        const t = this._trackers.get(trackerId);
        return t && { ...t };
    }

    /**
     * Trackers whose rule reads `entryId` — e.g. every tracker watching a given incidents area. Derived
     * from each rule's analysis `affectedEntryIds` (the inputs are NOT duplicated onto the tracker), so it
     * stays correct if a rule's inputs change. Drives "show all trackers for this area" in the UI.
     */
    trackersForEntry(entryId: string): readonly Tracker[] {
        return this.trackers.filter((t) => this.analyses.get(t.analysisId)?.affectedEntryIds.includes(entryId));
    }

    /**
     * The event log, newest last. Pass `sinceMs` to filter and `trackerId` to scope. Returns deep copies
     * so a caller can't mutate a logged event (or its `members`) and corrupt the store.
     */
    log(opts: { trackerId?: string; sinceMs?: number } = {}): readonly TrackerEvent[] {
        return this._log
            .filter(
                (e) =>
                    (opts.trackerId === undefined || e.trackerId === opts.trackerId) &&
                    (opts.sinceMs === undefined || e.at >= opts.sinceMs),
            )
            .map((e) => structuredClone(e));
    }

    /** Clear all trackers + log. The analyses subscription persists (no-ops without trackers). */
    reset(): void {
        this._trackers.clear();
        this._trackerByAnalysis.clear();
        this._log.length = 0;
        this._seq = 0;
    }

    // The rising-edge reducer. Runs on every `analysis-change`; bails fast unless the changed analysis
    // backs a live, enabled tracker. A verdict flipping false→true logs `opened` (alert); true→false
    // logs `resolved` (event). No change on active→active / inactive→inactive.
    private onAnalysisChange(analysisId: string): void {
        const trackerId = this._trackerByAnalysis.get(analysisId);
        if (trackerId === undefined) return;
        const tracker = this._trackers.get(trackerId);
        if (!tracker?.enabled) return;

        const history = this.analyses.history(analysisId);
        const latest = history[history.length - 1];
        if (!latest || !isVerdict(latest.data)) return;
        const verdict = latest.data;
        const at = latest.timestamp;

        if (verdict.active && !tracker.wasActive) {
            tracker.wasActive = true;
            tracker.openedAt = at;
            this.append(tracker, { type: 'alert', kind: 'opened', verdict, at });
        } else if (!verdict.active && tracker.wasActive) {
            const openedAt = tracker.openedAt;
            tracker.wasActive = false;
            tracker.openedAt = undefined;
            this.append(tracker, { type: 'event', kind: 'resolved', verdict, at, openedAt });
        }
    }

    private append(
        tracker: Tracker,
        e: { type: TrackerEventType; kind: TrackerEventStatus; verdict: Verdict; at: number; openedAt?: number },
    ): void {
        const event: TrackerEvent = {
            id: `${tracker.id}:${e.kind}:${this._seq++}`,
            at: e.at,
            trackerId: tracker.id,
            trackerName: tracker.name,
            type: e.type,
            kind: e.kind,
            summary: e.verdict.summary,
            members: e.verdict.members.map((m) => ({ entryId: m.entryId, featureIds: [...m.featureIds] })),
            ...(e.openedAt !== undefined && { openedAt: e.openedAt }),
        };
        this._log.push(event);
        // Cap per tracker, not globally: evict THIS tracker's oldest event once it exceeds the cap. The
        // log is append-ordered, so the first matching entry is the oldest. At most one over-cap per push.
        const own = this._log.filter((ev) => ev.trackerId === tracker.id);
        if (own.length > MAX_TRACKER_EVENTS) this._log.splice(this._log.indexOf(own[0]), 1);
        this.events.emit('tracker-event', event);
        this.emitTrackers();
    }

    private emitTrackers(): void {
        this.events.emit('trackers-change', this.trackers);
    }
}

/** Structural guard: trust the dry-run gate, but never let a malformed runtime verdict crash the reducer. */
function isVerdict(data: unknown): data is Verdict {
    if (typeof data !== 'object' || data === null) return false;
    const v = data as Record<string, unknown>;
    return typeof v.active === 'boolean' && typeof v.summary === 'string' && Array.isArray(v.members);
}
