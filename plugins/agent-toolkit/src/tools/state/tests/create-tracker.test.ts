import { describe, expect, it } from 'vitest';
import { createToolState } from '../../../state';
import type { TrackerEvent } from '../../../state/trackers';
import type { ToolState } from '../../../types';
import { executeCreateTracker } from '../create-tracker';

const mockTrafficMap = { mapLibreMap: { getSource: () => undefined, getLayer: () => undefined } } as any;

const fakeIncident = (id: string): any => ({
    type: 'Feature',
    id,
    properties: { id, category: 'jam', magnitudeOfDelay: 'major', timeValidity: 'present', events: [] },
    geometry: { type: 'Point', coordinates: [0, 0] },
});

const seedIncidents = (state: ToolState, ids: string[]): Promise<string> =>
    state.trafficIncidents.addIncidentsEntry(
        ids.map(fakeIncident),
        { bbox: [0, 0, 1, 1] as any },
        'london',
        0,
        'incidents-0',
    );

// A rule whose verdict is active iff the entry currently has any incident.
const ANY_INCIDENT_CODE =
    'const inc = incidentsByEntry["incidents-0"]; return { active: inc.length > 0, members: [{ entryId: "incidents-0", featureIds: inc.map((i) => i.properties.id) }], summary: inc.length + " incident(s)" };';

const arm = (state: ToolState, code: string, name = 'Any incident') =>
    executeCreateTracker({ incidentsEntryIDs: ['incidents-0'], name, rule: 'any incident in the area', code }, state);

describe('executeCreateTracker arm-time alert', () => {
    it('fires one opened alert when the condition is ALREADY met at creation', async () => {
        const state = createToolState(mockTrafficMap);
        await seedIncidents(state, ['a', 'b']); // condition is already true

        const events: TrackerEvent[] = [];
        state.trackers.events.on('tracker-event', (e) => events.push(e));

        const out = await arm(state, ANY_INCIDENT_CODE);
        if ('error' in out) throw new Error(out.error);

        expect(out.firingNow).toBe(true);
        // The user asked to watch something already happening — surface it once, as a toastable alert.
        expect(events.map((e) => [e.kind, e.type])).toEqual([['opened', 'alert']]);
        expect(events[0].summary).toBe('2 incident(s)');
        expect(state.trackers.get(out.trackerId)?.wasActive).toBe(true);
    });

    it('does NOT fire when the condition is not met at creation, but still arms the tracker', async () => {
        const state = createToolState(mockTrafficMap);
        await seedIncidents(state, ['a']);

        const events: TrackerEvent[] = [];
        state.trackers.events.on('tracker-event', (e) => events.push(e));

        const out = await arm(state, 'return { active: false, members: [], summary: "clear" };');
        if ('error' in out) throw new Error(out.error);

        expect(out.firingNow).toBe(false);
        expect(events).toEqual([]);
        expect(state.trackers.get(out.trackerId)?.wasActive).toBe(false);
    });

    it('does not re-toast the arm-time alert a second time (single edge)', async () => {
        const state = createToolState(mockTrafficMap);
        await seedIncidents(state, ['a', 'b']);

        const events: TrackerEvent[] = [];
        state.trackers.events.on('tracker-event', (e) => events.push(e));

        await arm(state, ANY_INCIDENT_CODE);
        // Let any debounced/async recompute settle — it must not produce a second opened.
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(events.filter((e) => e.kind === 'opened')).toHaveLength(1);
    });
});
