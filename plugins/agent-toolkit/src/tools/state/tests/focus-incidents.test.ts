import { describe, expect, it } from 'vitest';
import { createToolState } from '../../../state';
import { executeFocusIncidents } from '../focus-incidents';

const mockTrafficMap = { mapLibreMap: { getSource: () => undefined, getLayer: () => undefined } } as any;

const fakeIncident = (id: string): any => ({
    type: 'Feature',
    id,
    properties: { id, category: 'jam', magnitudeOfDelay: 'moderate', timeValidity: 'present', events: [] },
    geometry: { type: 'Point', coordinates: [0, 0] },
});

describe('focusIncidents', () => {
    it('focuses the requested ids on the named entry', async () => {
        const state = createToolState(mockTrafficMap);
        const id = await state.trafficIncidents.addIncidentsEntry(
            [fakeIncident('a'), fakeIncident('b'), fakeIncident('c')],
            { bbox: [0, 0, 1, 1] as any },
            'london',
            0,
        );
        const out = await executeFocusIncidents(
            { incidentsEntryID: id, incidentIds: ['a', 'b'], reason: 'top 2' },
            state,
        );
        expect('error' in out).toBe(false);
        if ('error' in out) return;
        expect(out.focusedCount).toBe(2);
        expect(out.droppedIds).toEqual([]);
        expect(out.reason).toBe('top 2');
        const focus = state.trafficIncidents.getFocus(id);
        expect(focus?.ids.size).toBe(2);
    });

    it('drops unknown ids silently in partial-success', async () => {
        const state = createToolState(mockTrafficMap);
        const id = await state.trafficIncidents.addIncidentsEntry(
            [fakeIncident('a'), fakeIncident('b')],
            { bbox: [0, 0, 1, 1] as any },
            'london',
            0,
        );
        const out = await executeFocusIncidents({ incidentsEntryID: id, incidentIds: ['a', 'gone'] }, state);
        expect('error' in out).toBe(false);
        if ('error' in out) return;
        expect(out.focusedCount).toBe(1);
        expect(out.droppedIds).toEqual(['gone']);
    });

    it('errors when the entry does not exist', async () => {
        const state = createToolState(mockTrafficMap);
        const out = await executeFocusIncidents({ incidentsEntryID: 'missing', incidentIds: ['a'] }, state);
        expect('error' in out).toBe(true);
    });

    it('errors when ALL ids are unknown', async () => {
        const state = createToolState(mockTrafficMap);
        const id = await state.trafficIncidents.addIncidentsEntry(
            [fakeIncident('a')],
            { bbox: [0, 0, 1, 1] as any },
            'london',
            0,
        );
        const out = await executeFocusIncidents({ incidentsEntryID: id, incidentIds: ['gone-1', 'gone-2'] }, state);
        expect('error' in out).toBe(true);
        if ('error' in out) {
            expect(out.error).toMatch(/None of the 2 requested ids/);
        }
    });
});
