import { describe, expect, it } from 'vitest';
import { createToolState, type TrafficIncidentsEntry } from '../../../state';
import type { ToolState } from '../../../types';
import { executeAnalyseData } from '../analyse-data';

const mockTrafficMap = { mapLibreMap: { getSource: () => undefined, getLayer: () => undefined } } as any;

const fakeIncident = (id: string): any => ({
    type: 'Feature',
    id,
    properties: { id, category: 'jam', magnitudeOfDelay: 'moderate', timeValidity: 'present', events: [] },
    geometry: { type: 'Point', coordinates: [0, 0] },
});

describe('analyseData (monitor path — incidents spec rerun)', () => {
    it('registers a spec on the source entry and runs it once', async () => {
        const state: ToolState = createToolState(mockTrafficMap);
        const id = await state.trafficIncidents.addIncidentsEntry(
            [fakeIncident('a'), fakeIncident('b')],
            { bbox: [0, 0, 1, 1] as any },
            'london',
            0,
        );
        const out = await executeAnalyseData(
            {
                incidentsEntryIDs: [id],
                monitor: { entryId: id },
                name: 'count',
                code: 'return { n: incidents.length };',
            },
            state,
        );
        expect('error' in out).toBe(false);
        const entry = state.trafficIncidents.entries.find((e: TrafficIncidentsEntry) => e.id === id)!;
        expect(entry._analyses?.specs[0]?.name).toBe('count');
        expect(entry._analyses?.getResult('count')?.data).toEqual({ n: 2 });
    });

    it('subsequent run with the same name replaces the registered spec', async () => {
        const state: ToolState = createToolState(mockTrafficMap);
        const id = await state.trafficIncidents.addIncidentsEntry(
            [fakeIncident('a')],
            { bbox: [0, 0, 1, 1] as any },
            'london',
            0,
        );
        await executeAnalyseData(
            { incidentsEntryIDs: [id], monitor: { entryId: id }, name: 'x', code: 'return 1;' },
            state,
        );
        await executeAnalyseData(
            { incidentsEntryIDs: [id], monitor: { entryId: id }, name: 'x', code: 'return 2;' },
            state,
        );
        const entry = state.trafficIncidents.entries.find((e: TrafficIncidentsEntry) => e.id === id)!;
        expect(entry._analyses?.specs).toHaveLength(1);
        expect(entry._analyses!.specs[0].code).toBe('return 2;');
    });

    it('reports the affected entry in the response', async () => {
        const state: ToolState = createToolState(mockTrafficMap);
        const id = await state.trafficIncidents.addIncidentsEntry(
            [fakeIncident('a'), fakeIncident('b')],
            { bbox: [0, 0, 1, 1] as any },
            'london',
            0,
        );
        const out = await executeAnalyseData(
            {
                incidentsEntryIDs: [id],
                monitor: { entryId: id },
                name: 'count',
                code: 'return { n: incidents.length };',
            },
            state,
        );
        if ('error' in out) throw new Error(out.error);
        expect(out.affectedEntries).toEqual([{ kind: 'incidents', id }]);
        expect(out.analysis).toEqual({ n: 2 });
    });
});
