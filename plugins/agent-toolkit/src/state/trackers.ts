/**
 * @module agent-toolkit-state
 *
 * The {@link EventsState} slice — generic trackers over toolkit state. A tracker is one rule: sandbox
 * code returning a {@link Verdict}, recomputed by a {@link JobEngine} job whenever its source entries
 * change. The rule's INPUTS are the job's (and the tracker's) `affectedEntryIds` — a rule reads one or
 * more entry kinds, e.g. hospitals + incidents. This slice owns the tracker metadata, one bit of
 * rising-edge memory (`wasActive`), the {@link Job} handle backing it, and the durable
 * {@link TrackerEvent} log the UI renders.
 *
 * It computes nothing itself. The job's `run` hands each fresh verdict to {@link ingestVerdict}, which
 * runs a pure rising-edge reducer: a verdict flipping `false→true` logs an `opened` alert, `true→false`
 * logs a `resolved` event. There is no episode state machine, escalation, or resolve-hysteresis: a
 * jittery feed can therefore produce open/resolve churn.
 *
 * @group Agent Toolkit
 */

import type { Job } from '../engine';
import type { StateSlice } from '../types/state';
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
 * One tracker = one rule: an NL condition plus its rising-edge state. The compiled code lives on the
 * tracker's {@link Job}, not here. `affectedEntryIds` are the entries the rule watches; a verdict's
 * `members` are the ones that matched.
 */
export type Tracker = {
    id: string;
    name: string;
    /** Natural-language condition (LLM-readable); the compiled code lives on the tracker's job. */
    rule: string;
    /** Ids of every entry the rule reads — the per-entry lookup key ({@link EventsState.trackersForEntry}). */
    affectedEntryIds: readonly string[];
    enabled: boolean;
    /** The one bit of memory: was the verdict active at the last recompute (rising-edge detection). */
    wasActive: boolean;
    /** Rising-edge time of the current open episode, if active. */
    openedAt?: number;
};

/** Events emitted by {@link EventsState}. */
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
 * storage + reaction: tools register/unregister trackers and register their rule jobs on the
 * {@link JobEngine}; each job's `run` feeds verdicts here via {@link ingestVerdict}. Keeps the
 * {@link Job} handle backing each tracker (`_jobs`) so pausing a tracker pauses its job.
 *
 * @group Agent Toolkit
 */
export class EventsState implements StateSlice {
    private readonly _trackers = new Map<string, Tracker>();
    private readonly _log: TrackerEvent[] = [];
    /** trackerId → the {@link Job} backing it. The reference linking tracker to engine. */
    private readonly _jobs = new Map<string, Job>();
    private _seq = 0;

    readonly events = new StateEvents<TrackerStateEvents>();

    /**
     * Register a tracker. The caller (createTracker) registers it with the rising-edge bit clear
     * (`wasActive: false`) and feeds the arm-time verdict via {@link ingestVerdict} AFTER this call, so a
     * condition already live at creation crosses false→true and fires one `opened` alert. Emits
     * `trackers-change`.
     */
    register(tracker: Tracker): void {
        this._trackers.set(tracker.id, tracker);
        this.emitTrackers();
    }

    /** Store the {@link Job} backing a tracker — the reference linking it to the engine. */
    setJob(trackerId: string, job: Job): void {
        this._jobs.set(trackerId, job);
    }

    /** Remove a tracker and tear down its job. */
    unregister(trackerId: string): void {
        if (!this._trackers.has(trackerId)) return;
        this._jobs.get(trackerId)?.unregister();
        this._jobs.delete(trackerId);
        this._trackers.delete(trackerId);
        this.emitTrackers();
    }

    /** Pause/resume a tracker AND its job (a paused job never recomputes, so never crosses edges). */
    setEnabled(trackerId: string, enabled: boolean): boolean {
        const tracker = this._trackers.get(trackerId);
        if (!tracker) return false;
        tracker.enabled = enabled;
        this._jobs.get(trackerId)?.setActive(enabled);
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
     * Trackers whose rule reads `entryId` — e.g. every tracker watching a given incidents area. Drives
     * "show all trackers for this area" in the UI.
     */
    trackersForEntry(entryId: string): readonly Tracker[] {
        return this.trackers.filter((t) => t.affectedEntryIds.includes(entryId));
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

    /** Clear all trackers + log + job handles. Walked automatically by `destroyState`. */
    reset(): void {
        for (const job of this._jobs.values()) job.unregister();
        this._jobs.clear();
        this._trackers.clear();
        this._log.length = 0;
        this._seq = 0;
    }

    /**
     * Feed a freshly-computed verdict through the rising-edge reducer — called by the tracker's job `run`
     * on each recompute (and once at arm time). Bails fast unless the tracker is live + enabled. A verdict
     * flipping false→true logs `opened` (alert); true→false logs `resolved` (event). No change on
     * active→active / inactive→inactive. `at` is the source-data sample time of the recompute.
     */
    ingestVerdict(trackerId: string, verdict: Verdict, at: number): void {
        const tracker = this._trackers.get(trackerId);
        if (!tracker?.enabled) return;
        // Public method — never let a malformed verdict (a misbehaving rule that slipped the gate) crash
        // the reducer on `verdict.members.map`.
        if (!isVerdict(verdict)) return;

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

/**
 * Structural guard for a {@link Verdict} — the shape a tracker rule's sandbox `code` must return. The
 * arm-time gate and the job runner trust it before {@link EventsState.ingestVerdict}; ingest re-checks
 * defensively since it's public.
 */
export function isVerdict(data: unknown): data is Verdict {
    if (typeof data !== 'object' || data === null) return false;
    const verdictCandidate = data as Record<string, unknown>;
    return (
        typeof verdictCandidate.active === 'boolean' &&
        typeof verdictCandidate.summary === 'string' &&
        Array.isArray(verdictCandidate.members)
    );
}
