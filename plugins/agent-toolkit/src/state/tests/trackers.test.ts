import { beforeEach, describe, expect, it } from 'vitest';
import { EventsState, MAX_TRACKER_EVENTS, type Tracker, type TrackerEvent, type Verdict } from '../trackers';

// Drive the reducer the way a tracker's job `run` does: feed each fresh verdict straight to
// `ingestVerdict`, which applies the rising-edge reducer synchronously.
describe('EventsState rising-edge reducer', () => {
    let trackers: EventsState;
    let fired: TrackerEvent[];

    const verdict = (active: boolean, summary = 's'): Verdict => ({
        active,
        summary,
        members: [{ entryId: 'incidents-0', featureIds: ['i1'] }],
    });

    // Feed a verdict for tracker `t1` at time `at`, as its job would on a recompute.
    const recompute = (v: Verdict, at: number, trackerId = 't1') => trackers.ingestVerdict(trackerId, v, at);

    const tracker = (over: Partial<Tracker> = {}): Tracker => ({
        id: 't1',
        name: 'Hospital incidents',
        rule: 'incident within 100m of a hospital',
        affectedEntryIds: ['hospitals-0', 'incidents-0'],
        enabled: true,
        wasActive: false,
        ...over,
    });

    beforeEach(() => {
        trackers = new EventsState();
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

    it('a verdict for an unknown tracker id is a no-op', () => {
        trackers.register(tracker());
        recompute(verdict(true), 1, 'ghost');
        expect(fired).toEqual([]);
    });

    it('a malformed verdict is ignored without firing or throwing (defensive guard on the public reducer)', () => {
        trackers.register(tracker());
        expect(() => trackers.ingestVerdict('t1', { oops: true } as unknown as Verdict, 1)).not.toThrow();
        expect(fired).toEqual([]);
    });

    it('stops reacting once unregistered', () => {
        trackers.register(tracker());
        recompute(verdict(true), 1000);
        trackers.unregister('t1');
        recompute(verdict(false), 2000);
        expect(fired.map((e) => e.kind)).toEqual(['opened']); // resolved never logged
    });

    it('trackersForEntry derives the watching set from the tracker’s affectedEntryIds', () => {
        trackers.register(tracker()); // watches hospitals-0 + incidents-0
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
        trackers.register(tracker()); // t1
        trackers.register(tracker({ id: 't2', affectedEntryIds: ['x'] }));

        // t2 fires once.
        recompute(verdict(true), 1, 't2');
        expect(trackers.log({ trackerId: 't2' }).length).toBe(1);

        // t1 churns well past the cap (each toggle is one edge = one event).
        let at = 10;
        for (let i = 0; i < MAX_TRACKER_EVENTS + 50; i++) recompute(verdict(i % 2 === 0), at++);

        expect(trackers.log({ trackerId: 't1' }).length).toBe(MAX_TRACKER_EVENTS); // capped per tracker
        expect(trackers.log({ trackerId: 't2' }).length).toBe(1); // not starved by t1's churn
    });
});
