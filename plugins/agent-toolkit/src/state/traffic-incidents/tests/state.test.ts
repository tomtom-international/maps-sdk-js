import { describe, expect, it, vi } from 'vitest';
import { TrafficIncidentsState } from '../state';

const mockMap = {} as any;
const mockTrafficMap = { mapLibreMap: { getSource: () => undefined, getLayer: () => undefined } } as any;

describe('TrafficIncidentsState', () => {
    it('starts with empty entries and multiple mode', () => {
        const state = new TrafficIncidentsState(mockTrafficMap);
        expect(state.entries).toEqual([]);
        expect(state.entryMode).toBe('multiple');
    });

    it('appends entries with addIncidentsEntry and returns the id', () => {
        const state = new TrafficIncidentsState(mockTrafficMap);
        const feature = { type: 'Feature', properties: { id: 'i1' } } as any;

        const id = state.addIncidentsEntry([feature], { bbox: [0, 0, 1, 1] as any }, 'Amsterdam', 0);

        expect(id).toBe('incidents-0');
        expect(state.entries).toHaveLength(1);
        expect(state.entries[0]).toMatchObject({
            id: 'incidents-0',
            label: 'Amsterdam',
            data: [feature],
            params: { bbox: [0, 0, 1, 1] },
        });
        expect(state.entries[0].timestamp).toBeTypeOf('number');
    });

    it('auto-increments IDs across entries', () => {
        const state = new TrafficIncidentsState(mockTrafficMap);
        state.addIncidentsEntry([], { bbox: [0, 0, 1, 1] as any }, 'a', 0);
        state.addIncidentsEntry([], { bbox: [0, 0, 1, 1] as any }, 'b', 0);

        expect(state.entries[0].id).toBe('incidents-0');
        expect(state.entries[1].id).toBe('incidents-1');
    });

    it('accepts an explicit semantic id and de-duplicates on collision', () => {
        const state = new TrafficIncidentsState(mockTrafficMap);
        const a = state.addIncidentsEntry([], { bbox: [0, 0, 1, 1] as any }, 'a', 0, 'live-london');
        const b = state.addIncidentsEntry([], { bbox: [0, 0, 1, 1] as any }, 'a-again', 0, 'live-london');
        expect(a).toBe('live-london');
        expect(b).toBe('live-london-2');
    });

    it('de-duplicates the implicit fallback id after a remove (regression)', async () => {
        // add a, add b → ids `incidents-0`, `incidents-1`. Remove `incidents-0`,
        // then add a third → length is 1, so the naive `incidents-${length}` fallback
        // would collide with the surviving `incidents-1`. The slice must dedupe.
        const state = new TrafficIncidentsState(mockTrafficMap);
        state.addIncidentsEntry([], { bbox: [0, 0, 1, 1] as any }, 'a', 0);
        state.addIncidentsEntry([], { bbox: [0, 0, 1, 1] as any }, 'b', 0);
        await state.removeEntry('incidents-0');
        const c = state.addIncidentsEntry([], { bbox: [0, 0, 1, 1] as any }, 'c', 0);
        expect(c).not.toBe('incidents-1');
        expect(state.entries.map((e) => e.id)).toEqual(['incidents-1', c]);
    });

    it('emits entries-change on add and reset', () => {
        const state = new TrafficIncidentsState(mockTrafficMap);
        const seen: number[] = [];
        const unsub = state.events.on('entries-change', (entries) => seen.push(entries.length));
        state.addIncidentsEntry([], { bbox: [0, 0, 1, 1] as any }, 'a', 0);
        state.reset();
        unsub();
        expect(seen).toEqual([1, 0]);
    });

    it('reset clears entries', () => {
        const state = new TrafficIncidentsState(mockTrafficMap);
        state.addIncidentsEntry([], { bbox: [0, 0, 1, 1] as any }, 'a', 0);
        state.reset();
        expect(state.entries).toEqual([]);
    });

    it('single mode trims older entries on add', async () => {
        const state = new TrafficIncidentsState(mockTrafficMap);
        await state.setEntryMode('single');
        state.addIncidentsEntry([], { bbox: [0, 0, 1, 1] as any }, 'a', 0);
        state.addIncidentsEntry([], { bbox: [0, 0, 1, 1] as any }, 'b', 0);
        expect(state.entries).toHaveLength(1);
        expect(state.entries[0].label).toBe('b');
    });

    it('addAnalysisToEntry attaches analysis and emits analysis-change', () => {
        const state = new TrafficIncidentsState(mockTrafficMap);
        const id = state.addIncidentsEntry([], { bbox: [0, 0, 1, 1] as any }, 'a', 0);
        const seen: any[] = [];
        state.events.on('analysis-change', (e) => seen.push(e));
        const ok = state.addAnalysisToEntry(id, {
            name: 'by-cat',
            timestamp: Date.now(),
            outputFormat: 'json',
            data: { x: 1 },
        });
        expect(ok).toBe(true);
        expect(seen).toHaveLength(1);
        expect(seen[0]).toMatchObject({ entryId: id, analysis: { name: 'by-cat' } });
        expect(state.entries[0]._analyses?.history('by-cat')).toHaveLength(1);
    });

    it('addAnalysisToEntry appends to the timeline; getResult returns the latest', () => {
        const state = new TrafficIncidentsState(mockTrafficMap);
        const id = state.addIncidentsEntry([], { bbox: [0, 0, 1, 1] as any }, 'a', 0);
        state.addAnalysisToEntry(id, { name: 'k', timestamp: 1, outputFormat: 'json', data: 1 });
        state.addAnalysisToEntry(id, { name: 'k', timestamp: 2, outputFormat: 'json', data: 2 });
        expect(state.entries[0]._analyses?.history('k')).toHaveLength(2);
        expect(state.entries[0]._analyses?.getResult('k')).toMatchObject({ name: 'k', data: 2, timestamp: 2 });
    });

    it('setAnalysisSpec stores the spec on every named source entry', () => {
        const state = new TrafficIncidentsState(mockTrafficMap);
        const a = state.addIncidentsEntry([], { bbox: [0, 0, 1, 1] as any }, 'a', 0);
        const b = state.addIncidentsEntry([], { bbox: [0, 0, 1, 1] as any }, 'b', 0);
        state.setAnalysisSpec({
            name: 'count',
            outputFormat: 'json',
            code: 'return { n: incidents.length };',
            source: a,
        });
        const ea = state.entries.find((e) => e.id === a)!;
        const eb = state.entries.find((e) => e.id === b)!;
        expect(ea._analyses?.specs[0]?.name).toBe('count');
        expect(eb._analyses?.specs ?? []).toHaveLength(0);
    });

    it('setAnalysisSpec replaces an existing spec by name on the same entry', () => {
        const state = new TrafficIncidentsState(mockTrafficMap);
        const a = state.addIncidentsEntry([], { bbox: [0, 0, 1, 1] as any }, 'a', 0);
        state.setAnalysisSpec({ name: 'x', outputFormat: 'json', code: 'return 1;', source: a });
        state.setAnalysisSpec({ name: 'x', outputFormat: 'json', code: 'return 2;', source: a });
        const e = state.entries.find((e) => e.id === a)!;
        expect(e._analyses?.specs).toHaveLength(1);
        expect(e._analyses!.specs[0].code).toBe('return 2;');
    });

    it('removeAnalysisSpec drops the spec from its source entry', () => {
        const state = new TrafficIncidentsState(mockTrafficMap);
        const a = state.addIncidentsEntry([], { bbox: [0, 0, 1, 1] as any }, 'a', 0);
        state.setAnalysisSpec({ name: 'x', outputFormat: 'json', code: 'return 1;', source: a });
        state.removeAnalysisSpec('x');
        expect(state.entries.find((e) => e.id === a)!._analyses?.specs ?? []).toHaveLength(0);
    });

    it('a monitor tick re-runs registered specs and replaces _analysis data', async () => {
        const state = new TrafficIncidentsState(mockTrafficMap);
        const f = (id: string): any => ({
            type: 'Feature',
            id,
            properties: { id },
            geometry: { type: 'Point', coordinates: [0, 0] },
        });
        const a = state.addIncidentsEntry([f('1')], { bbox: [0, 0, 1, 1] as any }, 'a', 0);
        state.setAnalysisSpec({
            name: 'count',
            outputFormat: 'json',
            code: 'return { n: incidents.length };',
            source: a,
        });
        // Seed initial result so the equality check is meaningful.
        state.addAnalysisToEntry(a, { name: 'count', timestamp: 0, outputFormat: 'json', data: { n: 1 } });
        // Simulate a tick by calling replaceEntryData with a 3-incident snapshot.
        await state.replaceEntryData(a, [f('1'), f('2'), f('3')], 0);
        const entry = state.entries.find((e) => e.id === a)!;
        const analysis = entry._analyses?.getResult('count');
        expect(analysis?.data).toEqual({ n: 3 });
    });

    it('analyses keep a per-name history so consumers can trend results over ticks', async () => {
        const state = new TrafficIncidentsState(mockTrafficMap);
        const f = (id: string): any => ({
            type: 'Feature',
            id,
            properties: { id },
            geometry: { type: 'Point', coordinates: [0, 0] },
        });
        const a = state.addIncidentsEntry([f('1')], { bbox: [0, 0, 1, 1] as any }, 'a', 0);
        state.setAnalysisSpec({
            name: 'count',
            outputFormat: 'json',
            code: 'return { n: incidents.length };',
            source: a,
        });
        await state.replaceEntryData(a, [f('1'), f('2')], 0);
        await state.replaceEntryData(a, [f('1'), f('2'), f('3')], 0);
        await state.replaceEntryData(a, [f('1')], 0);
        const entry = state.entries.find((e) => e.id === a)!;
        const history = entry._analyses?.history('count') ?? [];
        expect(history.map((r) => (r.data as { n: number }).n)).toEqual([2, 3, 1]);
        expect(entry._analyses?.getResult('count')?.data).toEqual({ n: 1 });
    });

    it('a tick passes the prior _analysis result back to the spec as `previous`', async () => {
        const state = new TrafficIncidentsState(mockTrafficMap);
        const f = (id: string): any => ({
            type: 'Feature',
            id,
            properties: { id },
            geometry: { type: 'Point', coordinates: [0, 0] },
        });
        const a = state.addIncidentsEntry([f('1')], { bbox: [0, 0, 1, 1] as any }, 'a', 0);
        state.setAnalysisSpec({
            name: 'echo',
            outputFormat: 'json',
            code: 'return { count: incidents.length, prev: previous };',
            source: a,
        });
        // Seed the prior result the slice will read back as `previous`.
        state.addAnalysisToEntry(a, {
            name: 'echo',
            timestamp: 0,
            outputFormat: 'json',
            data: { count: 99, prev: undefined },
        });
        await state.replaceEntryData(a, [f('1'), f('2')], 0);
        const entry = state.entries.find((e) => e.id === a)!;
        const analysis = entry._analyses?.getResult('echo');
        expect(analysis?.data).toEqual({ count: 2, prev: { count: 99, prev: undefined } });
    });

    it('removed entries lose their specs', async () => {
        const state = new TrafficIncidentsState(mockTrafficMap);
        const a = state.addIncidentsEntry([], { bbox: [0, 0, 1, 1] as any }, 'a', 0);
        state.setAnalysisSpec({ name: 'x', outputFormat: 'json', code: 'return 1;', source: a });
        await state.removeEntry(a);
        expect(state.entries.find((e) => e.id === a)).toBeUndefined();
    });

    it('findEntryWithIncident scans newest-first', () => {
        const state = new TrafficIncidentsState(mockTrafficMap);
        const f = (id: string): any => ({
            type: 'Feature',
            properties: { id },
            geometry: { type: 'Point', coordinates: [0, 0] },
        });
        const a = state.addIncidentsEntry([f('x')], { bbox: [0, 0, 1, 1] as any }, 'a', 0);
        const b = state.addIncidentsEntry([f('y')], { bbox: [0, 0, 1, 1] as any }, 'b', 0);
        expect(state.findEntryWithIncident('x')?.id).toBe(a);
        expect(state.findEntryWithIncident('y')?.id).toBe(b);
        expect(state.findEntryWithIncident('z')).toBeUndefined();
    });

    it('emits monitor-start once on idle → running and skips the idempotent re-call', () => {
        const state = new TrafficIncidentsState(mockTrafficMap);
        const entryId = state.addIncidentsEntry([], { bbox: [0, 0, 1, 1] as any }, 'fake', 0);
        const seen: string[] = [];
        state.events.on('monitor-start', (p) => seen.push(p.entryId));
        const deps = {
            fetchIncidents: async () => [],
            setInterval: (() => 1) as unknown as typeof setInterval,
            clearInterval: () => {},
        };
        state.startMonitoring(entryId, { bbox: [0, 0, 1, 1] as any, capturedAt: 0 }, deps);
        // Second call is a documented no-op; subscribers must not see a duplicate event.
        state.startMonitoring(entryId, { bbox: [0, 0, 1, 1] as any, capturedAt: 0 }, deps);
        expect(seen).toEqual([entryId]);
        state.stopMonitoring(entryId);
    });

    it('emits monitor-stop with reason: manual on stopMonitoring; no-op when idle', () => {
        const state = new TrafficIncidentsState(mockTrafficMap);
        const entryId = state.addIncidentsEntry([], { bbox: [0, 0, 1, 1] as any }, 'fake', 0);
        const seen: Array<{ entryId: string; reason: 'manual' | 'error' }> = [];
        state.events.on('monitor-stop', (p) => seen.push(p));
        // Stop on an idle monitor must not emit — there's nothing to stop.
        state.stopMonitoring(entryId);
        expect(seen).toHaveLength(0);
        state.startMonitoring(
            entryId,
            { bbox: [0, 0, 1, 1] as any, capturedAt: 0 },
            {
                fetchIncidents: async () => [],
                setInterval: (() => 1) as unknown as typeof setInterval,
                clearInterval: () => {},
            },
        );
        state.stopMonitoring(entryId);
        expect(seen).toEqual([{ entryId, reason: 'manual' }]);
    });

    it('emits monitor-stop with reason: error alongside monitor-error when a poll throws', async () => {
        const state = new TrafficIncidentsState(mockTrafficMap);
        const entryId = state.addIncidentsEntry([], { bbox: [0, 0, 1, 1] as any }, 'fake', 0);
        const stops: Array<{ entryId: string; reason: 'manual' | 'error' }> = [];
        const errors: Array<{ entryId: string; error: string }> = [];
        state.events.on('monitor-stop', (p) => stops.push(p));
        state.events.on('monitor-error', (p) => errors.push(p));
        state.startMonitoring(
            entryId,
            { bbox: [0, 0, 1, 1] as any, capturedAt: 0 },
            {
                fetchIncidents: async () => {
                    throw new Error('boom');
                },
                setInterval: (() => 1) as unknown as typeof setInterval,
                clearInterval: () => {},
            },
        );
        await new Promise((r) => setTimeout(r, 10));
        expect(errors).toEqual([{ entryId, error: 'boom' }]);
        expect(stops).toEqual([{ entryId, reason: 'error' }]);
    });

    it('emits monitor-error and stops the timer when fetchSnapshot throws', async () => {
        const state = new TrafficIncidentsState(mockTrafficMap);
        const entryId = state.addIncidentsEntry([], { bbox: [0, 0, 1, 1] as any }, 'fake', 0);
        let received: { entryId: string; error: string } | null = null;
        state.events.on('monitor-error', (p) => {
            received = p as { entryId: string; error: string };
        });
        let intervalCleared = false;
        state.startMonitoring(
            entryId,
            { bbox: [0, 0, 1, 1] as any, capturedAt: Date.now() },
            {
                fetchIncidents: async () => {
                    throw new Error('boom');
                },
                setInterval: (() => 1) as unknown as typeof setInterval,
                clearInterval: () => {
                    intervalCleared = true;
                },
            },
        );
        await new Promise((r) => setTimeout(r, 10));
        expect(received).toEqual({ entryId, error: 'boom' });
        expect(intervalCleared).toBe(true);
    });
});

describe('TrafficIncidentsState — focus', () => {
    const feat = (id: string): any => ({
        type: 'Feature',
        id,
        properties: { id, category: 'jam', magnitudeOfDelay: 'minor', timeValidity: 'present', events: [] },
        geometry: { type: 'Point', coordinates: [0, 0] },
    });

    // Inject a module stand-in onto an entry — bypasses the lazy getEntryModule()
    // path so focus tests can spy on what setFocus(null|ids[]) forwards.
    const stubEntryModule = (state: TrafficIncidentsState, entryId: string): { setFocus: ReturnType<typeof vi.fn> } => {
        const setFocusSpy = vi.fn();
        const entry = state.entries.find((e) => e.id === entryId)!;
        (entry as unknown as { _module: { setFocus: typeof setFocusSpy } })._module = { setFocus: setFocusSpy };
        return { setFocus: setFocusSpy };
    };

    it('setFocus filters to IDs in the entry and reports dropped', () => {
        const state = new TrafficIncidentsState(mockMap);
        const id = state.addIncidentsEntry([feat('a'), feat('b')], { bbox: [0, 0, 1, 1] as any }, 'test', 0);

        const result = state.setFocus(id, ['a', 'missing'], 'top 1');

        expect(result).toEqual({ focusedCount: 1, droppedIds: ['missing'] });
        expect(state.getFocus(id)).toEqual({ ids: new Set(['a']), reason: 'top 1' });
    });

    it('setFocus with empty array clears focus', () => {
        const state = new TrafficIncidentsState(mockMap);
        const id = state.addIncidentsEntry([feat('a')], { bbox: [0, 0, 1, 1] as any }, 'test', 0);
        state.setFocus(id, ['a'], 'x');

        const result = state.setFocus(id, [], undefined);

        expect(result).toEqual({ focusedCount: 0, droppedIds: [] });
        expect(state.getFocus(id)).toBeNull();
    });

    it('setFocus emits focus-change once per transition', () => {
        const state = new TrafficIncidentsState(mockMap);
        const id = state.addIncidentsEntry([feat('a')], { bbox: [0, 0, 1, 1] as any }, 'test', 0);
        const fired: any[] = [];
        state.events.on('focus-change', (e) => fired.push(e));

        state.setFocus(id, ['a'], 'x');
        state.clearFocus(id);

        expect(fired).toHaveLength(2);
        expect(fired[0]).toMatchObject({ entryId: id, focus: { ids: new Set(['a']), reason: 'x' } });
        expect(fired[1]).toEqual({ entryId: id, focus: null });
    });

    it('setFocus with all-dropped is a no-op — no state change, no event', () => {
        const state = new TrafficIncidentsState(mockMap);
        const id = state.addIncidentsEntry([feat('a')], { bbox: [0, 0, 1, 1] as any }, 'test', 0);
        const fired: any[] = [];
        state.events.on('focus-change', (e) => fired.push(e));

        const result = state.setFocus(id, ['missing-1', 'missing-2'], 'x');

        expect(result).toEqual({ focusedCount: 0, droppedIds: ['missing-1', 'missing-2'] });
        expect(state.getFocus(id)).toBeNull();
        expect(fired).toHaveLength(0);
    });

    it('setFocus keeps every id present on the entry without an internal cap', () => {
        const state = new TrafficIncidentsState(mockMap);
        const lots = Array.from({ length: 60 }, (_, i) => feat(`x${i}`));
        const id = state.addIncidentsEntry(lots, { bbox: [0, 0, 1, 1] as any }, 'test', 0);

        const result = state.setFocus(
            id,
            lots.map((f) => f.properties.id),
            'lots',
        );

        expect(result.focusedCount).toBe(60);
        expect(result.droppedIds).toHaveLength(0);
    });

    it('forwards setFocus(keep) and setFocus(null) to the entry module', () => {
        const state = new TrafficIncidentsState(mockMap);
        const id = state.addIncidentsEntry([feat('a'), feat('b')], { bbox: [0, 0, 1, 1] as any }, 'test', 0);
        const stub = stubEntryModule(state, id);

        state.setFocus(id, ['a'], 'x');
        expect(stub.setFocus).toHaveBeenLastCalledWith(['a']);

        state.clearFocus(id);
        expect(stub.setFocus).toHaveBeenLastCalledWith(null);
    });

    describe('focusedFeatures + navigateFocus', () => {
        const point = (id: string, coord: [number, number]): any => ({
            type: 'Feature',
            id,
            properties: { id, category: 'jam', magnitudeOfDelay: 'minor', timeValidity: 'present', events: [] },
            geometry: { type: 'Point', coordinates: coord },
        });
        const line = (id: string, coords: [number, number][]): any => ({
            type: 'Feature',
            id,
            properties: { id, category: 'jam', magnitudeOfDelay: 'minor', timeValidity: 'present', events: [] },
            geometry: { type: 'LineString', coordinates: coords },
        });

        const makeMap = () => {
            const flyTo = vi.fn();
            const fitBounds = vi.fn();
            const mapLibreMap = { getSource: () => undefined, getLayer: () => undefined, flyTo, fitBounds };
            return {
                ttMap: { mapLibreMap } as any,
                flyTo,
                fitBounds,
            };
        };

        it('focusedFeatures returns features in focus-order, skipping missing ids', () => {
            const { ttMap } = makeMap();
            const state = new TrafficIncidentsState(ttMap);
            const a = point('a', [1, 1]);
            const b = point('b', [2, 2]);
            const id = state.addIncidentsEntry([a, b], { bbox: [0, 0, 3, 3] as any }, 'test', 0);
            state.setFocus(id, ['b', 'a'], 'x');

            const features = state.focusedFeatures(id);
            expect(features.map((f) => f.properties.id)).toEqual(['b', 'a']);
        });

        it('focusedFeatures returns empty when no focus is active', () => {
            const { ttMap } = makeMap();
            const state = new TrafficIncidentsState(ttMap);
            const id = state.addIncidentsEntry([point('a', [1, 1])], { bbox: [0, 0, 1, 1] as any }, 'test', 0);
            expect(state.focusedFeatures(id)).toEqual([]);
        });

        it('navigateFocus(entryId, i) flies to the i-th focused Point incident', () => {
            const { ttMap, flyTo, fitBounds } = makeMap();
            const state = new TrafficIncidentsState(ttMap);
            const id = state.addIncidentsEntry(
                [point('a', [4.9, 52.37]), point('b', [4.95, 52.4])],
                { bbox: [0, 0, 5, 53] as any },
                'test',
                0,
            );
            state.setFocus(id, ['a', 'b'], 'x');

            state.navigateFocus(id, 1);

            expect(flyTo).toHaveBeenCalledWith(expect.objectContaining({ center: [4.95, 52.4] }));
            expect(fitBounds).not.toHaveBeenCalled();
        });

        it('navigateFocus(entryId, i) fits bounds for a LineString incident', () => {
            const { ttMap, fitBounds, flyTo } = makeMap();
            const state = new TrafficIncidentsState(ttMap);
            const id = state.addIncidentsEntry(
                [
                    line('a', [
                        [4.88, 52.36],
                        [4.92, 52.38],
                    ]),
                ],
                { bbox: [0, 0, 5, 53] as any },
                'test',
                0,
            );
            state.setFocus(id, ['a'], 'x');

            state.navigateFocus(id, 0);

            expect(fitBounds).toHaveBeenCalledWith([4.88, 52.36, 4.92, 52.38], expect.any(Object));
            expect(flyTo).not.toHaveBeenCalled();
        });

        it('navigateFocus wraps out-of-range indices so raw counters keep working', () => {
            const { ttMap, flyTo } = makeMap();
            const state = new TrafficIncidentsState(ttMap);
            const id = state.addIncidentsEntry(
                [point('a', [1, 1]), point('b', [2, 2]), point('c', [3, 3])],
                { bbox: [0, 0, 3, 3] as any },
                'test',
                0,
            );
            state.setFocus(id, ['a', 'b', 'c'], 'x');

            state.navigateFocus(id, -1);
            expect(flyTo).toHaveBeenLastCalledWith(expect.objectContaining({ center: [3, 3] }));

            state.navigateFocus(id, 4);
            expect(flyTo).toHaveBeenLastCalledWith(expect.objectContaining({ center: [2, 2] }));
        });

        it('navigateFocus is a no-op when no focus is active', () => {
            const { ttMap, flyTo, fitBounds } = makeMap();
            const state = new TrafficIncidentsState(ttMap);
            const id = state.addIncidentsEntry([point('a', [1, 1])], { bbox: [0, 0, 1, 1] as any }, 'test', 0);

            state.navigateFocus(id, 0);

            expect(flyTo).not.toHaveBeenCalled();
            expect(fitBounds).not.toHaveBeenCalled();
        });
    });
});
