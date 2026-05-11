import { describe, expect, it } from 'vitest';
import { createToolState, type TrafficIncidentsEntry } from '../../../state';
import type { ToolState } from '../../../types';
import { executeAnalyseIncidents } from '../analyse-incidents';

const mockTrafficMap = { mapLibreMap: { getSource: () => undefined, getLayer: () => undefined } } as any;

const fakeIncident = (id: string): any => ({
    type: 'Feature',
    id,
    properties: { id, category: 'jam', magnitudeOfDelay: 'moderate', timeValidity: 'present', events: [] },
    geometry: { type: 'Point', coordinates: [0, 0] },
});

describe('analyseIncidents', () => {
    it('registers a spec on the source entry and runs it once', async () => {
        const state: ToolState = createToolState(mockTrafficMap);
        const id = state.trafficIncidents.addIncidentsEntry(
            [fakeIncident('a'), fakeIncident('b')],
            { bbox: [0, 0, 1, 1] as any },
            'london',
            0,
        );
        const out = await executeAnalyseIncidents(
            { incidentsEntryID: id, name: 'count', code: 'return { n: incidents.length };' },
            state,
        );
        expect('error' in out).toBe(false);
        const entry = state.trafficIncidents.entries.find((e: TrafficIncidentsEntry) => e.id === id)!;
        expect(entry._analyses?.specs[0]?.name).toBe('count');
        expect(entry._analyses?.getResult('count')?.data).toEqual({ n: 2 });
    });

    it('subsequent analyseIncidents replaces the spec with the same name', async () => {
        const state: ToolState = createToolState(mockTrafficMap);
        const id = state.trafficIncidents.addIncidentsEntry(
            [fakeIncident('a')],
            { bbox: [0, 0, 1, 1] as any },
            'london',
            0,
        );
        await executeAnalyseIncidents({ incidentsEntryID: id, name: 'x', code: 'return 1;' }, state);
        await executeAnalyseIncidents({ incidentsEntryID: id, name: 'x', code: 'return 2;' }, state);
        const entry = state.trafficIncidents.entries.find((e: TrafficIncidentsEntry) => e.id === id)!;
        expect(entry._analyses?.specs).toHaveLength(1);
        expect(entry._analyses!.specs[0].code).toBe('return 2;');
    });

    it('falls back to the most recently fetched entry when no id is given', async () => {
        const state: ToolState = createToolState(mockTrafficMap);
        state.trafficIncidents.addIncidentsEntry([fakeIncident('a')], { bbox: [0, 0, 1, 1] as any }, 'a', 0);
        const b = state.trafficIncidents.addIncidentsEntry(
            [fakeIncident('b1'), fakeIncident('b2')],
            { bbox: [0, 0, 1, 1] as any },
            'b',
            0,
        );
        const out = await executeAnalyseIncidents({ name: 'count', code: 'return { n: incidents.length };' }, state);
        expect('error' in out).toBe(false);
        if (!('error' in out)) {
            expect(out.incidentsEntryID).toBe(b);
            expect(out.analysis).toEqual({ n: 2 });
        }
    });
});
