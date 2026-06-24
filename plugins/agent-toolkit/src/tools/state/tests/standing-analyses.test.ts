import { describe, expect, it } from 'vitest';
import { Analyses, createToolState, makeAnalysisId } from '../../../state';
import type { ToolState } from '../../../types';
import { executeAnalyseData } from '../analyse-data';
import { executeMonitorAnalysis } from '../monitor-analysis';

const mockTrafficMap = { mapLibreMap: { getSource: () => undefined, getLayer: () => undefined } } as any;

const fakeIncident = (id: string): any => ({
    type: 'Feature',
    id,
    properties: { id, category: 'jam', magnitudeOfDelay: 'moderate', timeValidity: 'present', events: [] },
    geometry: { type: 'Point', coordinates: [0, 0] },
});

const seedIncidents = async (state: ToolState, ids: string[]): Promise<string> =>
    state.trafficIncidents.addIncidentsEntry(
        ids.map(fakeIncident),
        { bbox: [0, 0, 1, 1] as any },
        'london',
        0,
        'incidents-0',
    );

// Run an async one-shot analysis over the seeded incidents entry and hand back the analysisId.
const analyseCount = (state: ToolState, name = 'count') =>
    executeAnalyseData({ incidentsEntryIDs: ['incidents-0'], name, code: 'return { n: incidents.length };' }, state);

// Replay is fired off the slice's `entries-change` via a debounced microtask, then runs async
// (prepareMultiInputs + sandbox). Poll a few macrotask turns until the attached result catches up.
const waitFor = async (predicate: () => boolean, tries = 30): Promise<void> => {
    for (let i = 0; i < tries; i++) {
        if (predicate()) return;
        await new Promise((resolve) => setTimeout(resolve, 0));
    }
};

// Read back the latest result a replay attached to an entry. Every kind reads analyses from the one
// top-level registry via `getAnalysesForEntry` — never off a slice.
const readAttached = (state: ToolState, entryId: string, name: string): unknown =>
    state.analyses.getAnalysesForEntry(entryId).find((a) => a.name === name)?.data;

describe('standing analyses (analyseData + monitorAnalysis)', () => {
    it('analyseData registers a disabled standing record and returns its analysisId', async () => {
        const state = createToolState(mockTrafficMap);
        await seedIncidents(state, ['a', 'b']);

        const out = await analyseCount(state);
        if ('error' in out) throw new Error(out.error);

        expect(out.analysis).toEqual({ n: 2 });
        expect(out.analysisId).toBe('count::incidents-0');
        const record = state.analyses.get(out.analysisId);
        expect(record?.enabled).toBe(false);
    });

    // Regression: the incidents panel reads analyses per entry. A one-shot analyseData result is stored
    // in the top-level registry (no re-executing spec needed), so `getAnalysesForEntry` must surface it.
    it('surfaces a one-shot analyseData result via state.analyses.getAnalysesForEntry', async () => {
        const state = createToolState(mockTrafficMap);
        await seedIncidents(state, ['a', 'b']);
        await analyseCount(state, 'count');

        const results = state.analyses.getAnalysesForEntry('incidents-0');
        expect(results.map((r) => r.name)).toContain('count');
        expect(results.find((r) => r.name === 'count')?.data).toEqual({ n: 2 });
    });

    it('monitorAnalysis enable makes the analysis recompute when the source entry changes', async () => {
        const state = createToolState(mockTrafficMap);
        await seedIncidents(state, ['a', 'b']);
        const { analysisId } = (await analyseCount(state)) as { analysisId: string };

        const toggled = await executeMonitorAnalysis({ analysisId, enabled: true }, state);
        expect(toggled).toEqual({ analysisId, enabled: true });

        // A monitor-tick-style refresh: fresh data + a newer sampledAt on the same entry.
        await state.trafficIncidents.replaceEntryData('incidents-0', ['a', 'b', 'c'].map(fakeIncident), 1000);
        await waitFor(() => {
            const result = readAttached(state, 'incidents-0', 'count') as { n: number } | undefined;
            return result?.n === 3;
        });

        expect(readAttached(state, 'incidents-0', 'count')).toEqual({ n: 3 });
    });

    it('monitorAnalysis disable stops further recomputation', async () => {
        const state = createToolState(mockTrafficMap);
        await seedIncidents(state, ['a', 'b']);
        const { analysisId } = (await analyseCount(state)) as { analysisId: string };
        await executeMonitorAnalysis({ analysisId, enabled: true }, state);

        await state.trafficIncidents.replaceEntryData('incidents-0', ['a', 'b', 'c'].map(fakeIncident), 1000);
        await waitFor(() => {
            const r = readAttached(state, 'incidents-0', 'count') as { n: number } | undefined;
            return r?.n === 3;
        });

        await executeMonitorAnalysis({ analysisId, enabled: false }, state);
        await state.trafficIncidents.replaceEntryData('incidents-0', ['a', 'b', 'c', 'd'].map(fakeIncident), 2000);
        // Give a disabled sweep the same window it would have had if it were going to run.
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(readAttached(state, 'incidents-0', 'count')).toEqual({ n: 3 });
    });

    it('monitorAnalysis errors for an unknown analysisId', async () => {
        const state = createToolState(mockTrafficMap);
        const out = await executeMonitorAnalysis({ analysisId: 'nope::x', enabled: true }, state);
        expect('error' in out).toBe(true);
    });

    // The `cluster()` primitive is injected alongside h3/turf so dynamic analyseData code can filter
    // incidents and cluster the result in one pass (independent of the dedicated clusterIncidents tool).
    it('exposes the cluster() primitive to analyseData sandbox code', async () => {
        const state = createToolState(mockTrafficMap);
        await seedIncidents(state, ['a', 'b', 'c']);
        const out = await executeAnalyseData(
            {
                incidentsEntryIDs: ['incidents-0'],
                name: 'pockets',
                code: 'return { n: cluster(incidents, { minMembers: 3 }).groups.length };',
            },
            state,
        );
        if ('error' in out) throw new Error(out.error);
        expect(out.analysis).toEqual({ n: 1 });
    });
});

const fakePlace = (id: string): any => ({
    type: 'Feature',
    id,
    geometry: { type: 'Point', coordinates: [0, 0] },
    properties: { id, poi: { name: id, categories: ['cafe'] } },
});

const fakeRoute = (id: string): any => ({
    type: 'Feature',
    id,
    geometry: {
        type: 'LineString',
        coordinates: [
            [0, 0],
            [1, 1],
        ],
    },
    properties: { sections: {}, summary: { travelTimeInSeconds: 1, lengthInMeters: 1 } },
});

const placesCollection = (ids: string[]): any => ({ type: 'FeatureCollection', features: ids.map(fakePlace) });
const routesCollection = (ids: string[]): any => ({ type: 'FeatureCollection', features: ids.map(fakeRoute) });

// places / routes entries are append-only in the product (a re-search / recalculation pushes a NEW
// entry — `addPlaceResult` / `addRoutes` never overwrite an existing one; only the incidents monitor
// tick mutates an entry in place via `replaceEntryData`). These tests model an in-place data refresh
// of the bound entry and fire the slice's own `entries-change` — the same event every add/remove
// raises — to prove the standing sweep picks up the change and re-runs the analysis automatically.
describe('standing analyses — cross-kind replay on entries-change', () => {
    it('re-runs a monitored PLACES analysis when its source entry data changes', async () => {
        const state = createToolState(mockTrafficMap);
        await state.places.addPlaceResult(placesCollection(['a', 'b']), 'restaurants', 'places-1');
        const out = await executeAnalyseData(
            { placesEntryIDs: ['places-1'], name: 'count', code: 'return { n: places.features.length };' },
            state,
        );
        if ('error' in out) throw new Error(out.error);
        expect(out.analysis).toEqual({ n: 2 });
        await executeMonitorAnalysis({ analysisId: out.analysisId, enabled: true }, state);

        // Refresh the bound entry's data, then fire the slice's change event.
        const entry = state.places.entries.find((e) => e.id === 'places-1') as any;
        entry.places = [fakePlace('a'), fakePlace('b'), fakePlace('c')];
        entry.timestamp += 1000;
        state.places.events.emit('entries-change', { entries: state.places.entries, changedIds: ['places-1'] });

        await waitFor(() => (readAttached(state, 'places-1', 'count') as { n: number })?.n === 3);
        expect(readAttached(state, 'places-1', 'count')).toEqual({ n: 3 });
    });

    it('re-runs a monitored ROUTES analysis when its source entry data changes', async () => {
        const state = createToolState(mockTrafficMap);
        await state.routing.addRoutes(routesCollection(['r0']), [], 'ams-bru');
        const out = await executeAnalyseData(
            { routesEntryIDs: ['routes-0'], name: 'count', code: 'return { n: routes.features.length };' },
            state,
        );
        if ('error' in out) throw new Error(out.error);
        expect(out.analysis).toEqual({ n: 1 });
        await executeMonitorAnalysis({ analysisId: out.analysisId, enabled: true }, state);

        const entry = state.routing.entries.find((e) => e.id === 'routes-0') as any;
        entry.data = routesCollection(['r0', 'r1']);
        entry.timestamp += 1000;
        state.routing.events.emit('entries-change', { entries: state.routing.entries, changedIds: ['routes-0'] });

        await waitFor(() => (readAttached(state, 'routes-0', 'count') as { n: number })?.n === 2);
        expect(readAttached(state, 'routes-0', 'count')).toEqual({ n: 2 });
    });
});

// An entry can carry several analyses (unique names → unique analysisIds), and monitoring is per
// analysis: enabling a subset re-runs only those when the entry changes; the others stay one-shot.
describe('standing analyses — multiple analyses per entry, monitored independently', () => {
    it('re-runs only the monitored analyses on a source change, leaving one-shot ones untouched', async () => {
        const state = createToolState(mockTrafficMap);
        await seedIncidents(state, ['a', 'b']);
        // count-a is created but never monitored — it must stay at its one-shot value.
        await analyseCount(state, 'count-a');
        const b = (await analyseCount(state, 'count-b')) as { analysisId: string };
        const c = (await analyseCount(state, 'count-c')) as { analysisId: string };

        // Monitor b and c; leave a as a one-shot.
        await executeMonitorAnalysis({ analysisId: b.analysisId, enabled: true }, state);
        await executeMonitorAnalysis({ analysisId: c.analysisId, enabled: true }, state);

        await state.trafficIncidents.replaceEntryData('incidents-0', ['a', 'b', 'c', 'd'].map(fakeIncident), 1000);
        await waitFor(() => {
            const rb = readAttached(state, 'incidents-0', 'count-b') as { n: number } | undefined;
            const rc = readAttached(state, 'incidents-0', 'count-c') as { n: number } | undefined;
            return rb?.n === 4 && rc?.n === 4;
        });

        expect(readAttached(state, 'incidents-0', 'count-b')).toEqual({ n: 4 });
        expect(readAttached(state, 'incidents-0', 'count-c')).toEqual({ n: 4 });
        // a was never monitored — still its one-shot value.
        expect(readAttached(state, 'incidents-0', 'count-a')).toEqual({ n: 2 });
    });
});

// The Analyses store is the single source of truth: per-entry reads are derived, and records are
// garbage-collected once their source entries are gone (entries no longer hold their own analyses).
describe('Analyses store', () => {
    const result = (name: string, data: unknown) => ({ name, timestamp: 1, outputFormat: 'json' as const, data });
    const seed = (store: Analyses, name: string, affectedEntryIds: string[], data: unknown) => {
        const analysisId = makeAnalysisId(name, affectedEntryIds);
        store.register({ analysisId, name, outputFormat: 'json', affectedEntryIds });
        store.attachResult(analysisId, result(name, data));
        return analysisId;
    };

    it('getAnalysesForEntry returns the latest result of every analysis touching that entry', () => {
        const store = new Analyses();
        seed(store, 'shared', ['places-0', 'routes-0'], { n: 1 });
        seed(store, 'places-only', ['places-0'], { n: 2 });
        seed(store, 'elsewhere', ['routes-0'], { n: 3 });

        expect(
            store
                .getAnalysesForEntry('places-0')
                .map((a) => a.name)
                .sort((a, b) => a.localeCompare(b)),
        ).toEqual(['places-only', 'shared']);
        expect(
            store
                .getAnalysesForEntry('routes-0')
                .map((a) => a.name)
                .sort((a, b) => a.localeCompare(b)),
        ).toEqual(['elsewhere', 'shared']);
        expect(store.getAnalysesForEntry('missing')).toEqual([]);
    });

    it('all() returns every record in registration order for a combined view', () => {
        const store = new Analyses();
        seed(store, 'first', ['places-0'], 1);
        seed(store, 'second', ['routes-0'], 2);
        expect(store.all().map((r) => r.name)).toEqual(['first', 'second']);
        expect(store.all().map((r) => r.history.at(-1)?.data)).toEqual([1, 2]);
    });

    describe('type classifier', () => {
        // A tracker rule registers a `type: 'tracker-rule'` record — its own enumerable category. It
        // recomputes / GC's / reads by id exactly like an analysis, but operator enumeration excludes it.
        const seedRule = (store: Analyses, name: string, affectedEntryIds: string[], data: unknown) => {
            const analysisId = makeAnalysisId(name, affectedEntryIds);
            store.register({
                analysisId,
                name,
                outputFormat: 'json',
                affectedEntryIds,
                type: 'tracker-rule',
                enabled: true,
            });
            store.attachResult(analysisId, result(name, data));
            return analysisId;
        };

        it("register defaults type to 'analysis'", () => {
            const store = new Analyses();
            const id = seed(store, 'plain', ['places-0'], 1);
            expect(store.get(id)?.type).toBe('analysis');
        });

        it('all(type) partitions analyses from tracker rules; all() returns both', () => {
            const store = new Analyses();
            seed(store, 'plain', ['places-0'], 1);
            seedRule(store, 'rule', ['places-0'], 2);
            expect(store.all('analysis').map((r) => r.name)).toEqual(['plain']);
            expect(store.all('tracker-rule').map((r) => r.name)).toEqual(['rule']);
            expect(store.all().map((r) => r.name)).toEqual(['plain', 'rule']);
        });

        it('getAnalysesForEntry filters by type when one is given, returns all otherwise', () => {
            const store = new Analyses();
            seed(store, 'plain', ['places-0'], 1);
            seedRule(store, 'rule', ['places-0'], 2);
            expect(store.getAnalysesForEntry('places-0', 'analysis').map((a) => a.name)).toEqual(['plain']);
            expect(store.getAnalysesForEntry('places-0', 'tracker-rule').map((a) => a.name)).toEqual(['rule']);
            expect(
                store
                    .getAnalysesForEntry('places-0')
                    .map((a) => a.name)
                    .sort(),
            ).toEqual(['plain', 'rule']);
        });

        it('a tracker rule is still swept, readable by id, and GC d like any record', () => {
            const store = new Analyses();
            const id = seedRule(store, 'rule', ['places-0'], 2);
            expect(store.sweepCandidates().map((r) => r.analysisId)).toContain(id);
            expect(store.get(id)?.type).toBe('tracker-rule');
            expect(store.history(id).at(-1)?.data).toBe(2);
            store.pruneToLiveEntries(new Set());
            expect(store.get(id)).toBeUndefined();
        });

        it('re-register preserves type', () => {
            const store = new Analyses();
            const id = seedRule(store, 'rule', ['places-0'], 2);
            store.register({ analysisId: id, name: 'rule', outputFormat: 'json', affectedEntryIds: ['places-0'] });
            expect(store.get(id)?.type).toBe('tracker-rule');
        });
    });

    it('pruneToLiveEntries drops a record only once all its source entries are gone', () => {
        const store = new Analyses();
        const shared = seed(store, 'shared', ['places-0', 'routes-0'], 1);
        const placesOnly = seed(store, 'places-only', ['places-0'], 2);

        // routes-0 removed, places-0 still live → cross-kind record survives, single-source one survives.
        store.pruneToLiveEntries(new Set(['places-0']));
        expect(store.get(shared)).toBeDefined();
        expect(store.get(placesOnly)).toBeDefined();

        // places-0 removed too → both records gone.
        store.pruneToLiveEntries(new Set());
        expect(store.get(shared)).toBeUndefined();
        expect(store.get(placesOnly)).toBeUndefined();
    });
});

// The sweep wiring matches each `entries-change`'s `changedIds` against every monitored record's
// `affectedEntryIds`, so a change that doesn't touch a record's sources never re-runs it. These pin
// that precision (an unrelated entry, or an unrelated slice, must be a no-op) and the orphan GC.
describe('standing analyses — changedIds-scoped replay', () => {
    // A sweep is scheduled on a microtask then runs async; give it the window a real replay would take.
    const settle = async () => {
        for (let i = 0; i < 5; i++) await new Promise((resolve) => setTimeout(resolve, 0));
    };

    it('does not re-run a monitored analysis when an unrelated entry in the same slice changes', async () => {
        const state = createToolState(mockTrafficMap);
        await state.places.addPlaceResult(placesCollection(['a', 'b']), 'bound', 'places-bound');
        await state.places.addPlaceResult(placesCollection(['x']), 'other', 'places-other');
        const out = await executeAnalyseData(
            { placesEntryIDs: ['places-bound'], name: 'count', code: 'return { n: places.features.length };' },
            state,
        );
        if ('error' in out) throw new Error(out.error);
        await executeMonitorAnalysis({ analysisId: out.analysisId, enabled: true }, state);

        // Mutate the UNRELATED entry and fire a change naming only it — must not touch the bound analysis.
        const other = state.places.entries.find((e) => e.id === 'places-other') as any;
        other.places = [fakePlace('x'), fakePlace('y'), fakePlace('z')];
        other.timestamp += 1000;
        state.places.events.emit('entries-change', { entries: state.places.entries, changedIds: ['places-other'] });
        await settle();

        expect(readAttached(state, 'places-bound', 'count')).toEqual({ n: 2 });
    });

    it('does not re-run an incidents analysis when a places entry changes (cross-slice)', async () => {
        const state = createToolState(mockTrafficMap);
        await seedIncidents(state, ['a', 'b']);
        await state.places.addPlaceResult(placesCollection(['p']), 'places', 'places-0');
        const { analysisId } = (await analyseCount(state)) as { analysisId: string };
        await executeMonitorAnalysis({ analysisId, enabled: true }, state);

        // The incidents data really changes, but the event we fire is a PLACES change — its id can't
        // match the incidents analysis's `affectedEntryIds`, so no replay happens.
        const incidents = state.trafficIncidents.entries.find((e) => e.id === 'incidents-0') as any;
        incidents.data = ['a', 'b', 'c'].map(fakeIncident);
        incidents.timestamp += 1000;
        state.places.events.emit('entries-change', { entries: state.places.entries, changedIds: ['places-0'] });
        await settle();

        expect(readAttached(state, 'incidents-0', 'count')).toEqual({ n: 2 });
    });

    it('prunes a record when its only source entry is removed', async () => {
        const state = createToolState(mockTrafficMap);
        await state.places.addPlaceResult(placesCollection(['a']), 'bound', 'places-bound');
        const out = await executeAnalyseData(
            { placesEntryIDs: ['places-bound'], name: 'count', code: 'return { n: places.features.length };' },
            state,
        );
        if ('error' in out) throw new Error(out.error);
        expect(state.analyses.get(out.analysisId)).toBeDefined();

        // removeEntry emits `entries-change`; the sweep wiring's orphan GC drops records with no live source.
        await state.places.removeEntry('places-bound');
        await settle();

        expect(state.analyses.get(out.analysisId)).toBeUndefined();
    });
});
