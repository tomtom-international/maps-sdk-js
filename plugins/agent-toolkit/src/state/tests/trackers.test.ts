import { beforeEach, describe, expect, it } from 'vitest';
import { Analyses } from '../analyses';
import { MAX_TRACKER_EVENTS, type Tracker, type TrackerEvent, TrackerState, type Verdict } from '../trackers';

// Drive the reducer the way the standing sweep does: attach a verdict result to a tracker-rule analysis,
// which emits `analysis-change` and triggers TrackerState's rising-edge reducer synchronously.
describe('TrackerState rising-edge reducer', () => {
    let analyses: Analyses;
    let trackers: TrackerState;
    let fired: TrackerEvent[];

    const ANALYSIS = 'near-hospital::hospitals-0,incidents-0';

    const verdict = (active: boolean, summary = 's'): Verdict => ({
        active,
        summary,
        members: [{ entryId: 'incidents-0', featureIds: ['i1'] }],
    });

    // Register the rule analysis (as createTracker would) and push a verdict at time `at`.
    const recompute = (v: Verdict, at: number) => {
        analyses.register({
            analysisId: ANALYSIS,
            name: 'near-hospital',
            outputFormat: 'json',
            affectedEntryIds: ['hospitals-0', 'incidents-0'],
            type: 'tracker-rule',
            enabled: true,
        });
        analyses.attachResult(ANALYSIS, { name: 'near-hospital', timestamp: at, outputFormat: 'json', data: v });
    };

    const tracker = (over: Partial<Tracker> = {}): Tracker => ({
        id: 't1',
        name: 'Hospital incidents',
        rule: 'incident within 100m of a hospital',
        analysisId: ANALYSIS,
        enabled: true,
        wasActive: false,
        ...over,
    });

    beforeEach(() => {
        analyses = new Analyses();
        trackers = new TrackerState(analyses);
        fired = [];
        trackers.events.on('tracker-event', (e) => fired.push(e));
    });

    it('logs an opened alert on false→true and a resolved event on true→false', () => {
        trackers.register(tracker());

        recompute(verdict(true, 'incident 80m from St Mary’s'), 1000);
        expect(fired.map((e) => [e.kind, e.type])).toEqual([['opened', 'alert']]);
        expect(fired[0].summary).toBe('incident 80m from St Mary’s');
        expect(fired[0].at).toBe(1000); // opened's own `at` is the rising-edge time

        recompute(verdict(false), 2000);
        expect(fired.map((e) => e.kind)).toEqual(['opened', 'resolved']);
        const resolved = fired[1];
        expect(resolved.type).toBe('event');
        expect(resolved.at).toBe(2000);
        expect(resolved.openedAt).toBe(1000); // carries the open it closes
    });

    it('does not re-fire while the verdict stays active (no edge)', () => {
        trackers.register(tracker());
        recompute(verdict(true), 1000);
        recompute(verdict(true), 2000);
        recompute(verdict(true), 3000);
        expect(fired.map((e) => e.kind)).toEqual(['opened']);
    });

    it('seeded wasActive=true suppresses the arm-time opened, still resolves later', () => {
        trackers.register(tracker({ wasActive: true })); // already live at creation
        recompute(verdict(true), 1000);
        expect(fired).toEqual([]); // no opened — it was already active
        recompute(verdict(false), 2000);
        expect(fired.map((e) => e.kind)).toEqual(['resolved']);
    });

    it('a disabled tracker never crosses edges', () => {
        trackers.register(tracker({ enabled: false }));
        recompute(verdict(true), 1000);
        expect(fired).toEqual([]);
    });

    it('ignores analyses that are not tracker rules', () => {
        trackers.register(tracker());
        analyses.register({ analysisId: 'other::x', name: 'other', outputFormat: 'json', affectedEntryIds: ['x'] });
        analyses.attachResult('other::x', { name: 'other', timestamp: 1, outputFormat: 'json', data: verdict(true) });
        expect(fired).toEqual([]);
    });

    it('survives a malformed runtime verdict without firing or throwing', () => {
        trackers.register(tracker());
        analyses.register({
            analysisId: ANALYSIS,
            name: 'near-hospital',
            outputFormat: 'json',
            affectedEntryIds: ['hospitals-0'],
            type: 'tracker-rule',
            enabled: true,
        });
        expect(() =>
            analyses.attachResult(ANALYSIS, {
                name: 'near-hospital',
                timestamp: 1,
                outputFormat: 'json',
                data: { oops: true },
            }),
        ).not.toThrow();
        expect(fired).toEqual([]);
    });

    it('stops reacting once unregistered', () => {
        trackers.register(tracker());
        recompute(verdict(true), 1000);
        const freed = trackers.unregister('t1');
        expect(freed).toBe(ANALYSIS);
        recompute(verdict(false), 2000);
        expect(fired.map((e) => e.kind)).toEqual(['opened']); // resolved never logged
    });

    it('trackersForEntry derives the watching set from the analysis (entryIds are not stored)', () => {
        trackers.register(tracker()); // analysis affects hospitals-0 + incidents-0
        recompute(verdict(true), 1000); // registers the analysis with its affectedEntryIds
        expect(trackers.trackersForEntry('incidents-0').map((t) => t.id)).toEqual(['t1']);
        expect(trackers.trackersForEntry('hospitals-0').map((t) => t.id)).toEqual(['t1']);
        expect(trackers.trackersForEntry('places-9')).toEqual([]);
    });

    it('log() filters by tracker and sinceMs; reset clears everything', () => {
        trackers.register(tracker());
        recompute(verdict(true), 1000);
        recompute(verdict(false), 2000);
        expect(trackers.log().length).toBe(2);
        expect(trackers.log({ sinceMs: 1500 }).map((e) => e.kind)).toEqual(['resolved']);
        expect(trackers.log({ trackerId: 'nope' })).toEqual([]);
        trackers.reset();
        expect(trackers.log()).toEqual([]);
        expect(trackers.trackers).toEqual([]);
    });

    it('caps the log PER tracker — a noisy tracker never evicts a quiet one’s events', () => {
        const ANALYSIS_B = 'other-rule::x';
        trackers.register(tracker()); // t1 over ANALYSIS
        trackers.register(tracker({ id: 't2', analysisId: ANALYSIS_B }));

        // t2 fires once.
        analyses.register({
            analysisId: ANALYSIS_B,
            name: 'other-rule',
            outputFormat: 'json',
            affectedEntryIds: ['x'],
            type: 'tracker-rule',
            enabled: true,
        });
        analyses.attachResult(ANALYSIS_B, {
            name: 'other-rule',
            timestamp: 1,
            outputFormat: 'json',
            data: verdict(true),
        });
        expect(trackers.log({ trackerId: 't2' }).length).toBe(1);

        // t1 churns well past the cap (each toggle is one edge = one event).
        let at = 10;
        for (let i = 0; i < MAX_TRACKER_EVENTS + 50; i++) recompute(verdict(i % 2 === 0), at++);

        expect(trackers.log({ trackerId: 't1' }).length).toBe(MAX_TRACKER_EVENTS); // capped per tracker
        expect(trackers.log({ trackerId: 't2' }).length).toBe(1); // not starved by t1's churn
    });
});
