import { describe, expect, it } from 'vitest';
import { createToolState } from '../../../state';
import type { SandboxClusteringOutput } from '../../../state/traffic-incidents/clustering';
import type { ToolState } from '../../../types';
import { buildClusterIncidentsSchema, executeClusterIncidents } from '../cluster-incidents';

// Clustering is dedicated, typed `TrafficIncidentsState` state (NOT a generic analysis). The tool runs a
// clustering code snippet through the sandbox (the injected `cluster()` primitive) and stores the typed
// output on the slice; the monitor-tick re-run re-executes it. These tests exercise that full path.

const mockTrafficMap = { mapLibreMap: { getSource: () => undefined, getLayer: () => undefined } } as any;

// A jam incident at a coordinate, with the fields clustering reads (delay clears the default pre-filter).
const inc = (id: string, lng: number, lat: number, delayInSeconds = 120): any => ({
    type: 'Feature',
    id,
    properties: {
        id,
        category: 'jam',
        delayInSeconds,
        magnitudeOfDelay: 'moderate',
        timeValidity: 'present',
        events: [],
        roadNumbers: ['M25'],
    },
    geometry: { type: 'Point', coordinates: [lng, lat] },
});

// Three incidents within ~0.5km of each other form one DBSCAN cluster at the defaults (minMembers 3).
const tightCluster = (ids: string[]): any[] => ids.map((id, i) => inc(id, 4.9 + i * 0.001, 52.37 + i * 0.001));

const seed = (state: ToolState, incidents: any[], sampledAt = 0): Promise<string> =>
    state.trafficIncidents.addIncidentsEntry(incidents, { bbox: [4.8, 52.3, 5, 52.4] as any }, 'london', sampledAt);

const waitFor = async (predicate: () => boolean, tries = 30): Promise<void> => {
    for (let i = 0; i < tries; i++) {
        if (predicate()) return;
        await new Promise((resolve) => setTimeout(resolve, 0));
    }
};

const groups = (out: SandboxClusteringOutput | undefined) => out?.groups ?? [];

describe('clusterIncidents (dedicated clustering state)', () => {
    it('computes clusters and stores them as typed slice state, not in the analyses registry', async () => {
        const state = createToolState(mockTrafficMap);
        const id = await seed(state, tightCluster(['a', 'b', 'c']));

        const out = await executeClusterIncidents({ incidentsEntryID: id }, state);
        if ('error' in out) throw new Error(out.error);

        expect(out.clusterCount).toBe(1);
        expect(out.clusters[0].size).toBe(3);
        // Stored on the slice, typed — and NOT registered as an analysis.
        expect(groups(state.trafficIncidents.getClusters(id))).toHaveLength(1);
        expect(state.analyses.getAnalysesForEntry(id)).toEqual([]);
    });

    it('errors for an unknown entry', async () => {
        const state = createToolState(mockTrafficMap);
        const out = await executeClusterIncidents({ incidentsEntryID: 'nope' }, state);
        expect('error' in out).toBe(true);
    });

    it('runs dynamic `code` that filters incidents before clustering', async () => {
        const state = createToolState(mockTrafficMap);
        // Three big-delay incidents (tight) + three small-delay ones (also tight, same spot) — the code
        // keeps only the big-delay set, so a delay filter yields exactly one cluster of three.
        const big = tightCluster(['a', 'b', 'c']).map((f) => ({
            ...f,
            properties: { ...f.properties, delayInSeconds: 600 },
        }));
        const small = ['d', 'e', 'f'].map((id, i) => inc(id, 4.9 + i * 0.001, 52.37 + i * 0.001, 30));
        const id = await seed(state, [...big, ...small]);

        const out = await executeClusterIncidents(
            {
                incidentsEntryID: id,
                code: 'const slow = Object.values(incidentsByEntry).flat().filter((i) => i.properties.delayInSeconds >= 300); return cluster(slow, { minMembers: 3 }, previous, now);',
            },
            state,
        );
        if ('error' in out) throw new Error(out.error);

        expect(out.clusterCount).toBe(1);
        expect(out.clusters[0].size).toBe(3);
        // The stored recipe re-runs on a tick — the filter still applies.
        await state.trafficIncidents.replaceEntryData(id, [...big, ...small], 1000);
        await waitFor(() => state.trafficIncidents.getClusters(id)?.sampledAt === 1000);
        expect(state.trafficIncidents.getClusters(id)?.groups[0].size).toBe(3);
    });

    it('default clustering bypasses the sandbox executor; only custom `code` uses it', async () => {
        // Regression: the default path must run the trusted clusterer on the main thread, so a broken /
        // stale browser sandbox (e.g. a worker missing the `cluster` global) can never break it.
        const state = createToolState(mockTrafficMap);
        let sandboxRuns = 0;
        state.codeExecution = {
            run: async () => {
                sandboxRuns++;
                return { error: 'sandbox disabled' };
            },
            destroy: () => {},
        } as any;
        const id = await seed(state, tightCluster(['a', 'b', 'c']));

        const out = await executeClusterIncidents({ incidentsEntryID: id }, state);
        if ('error' in out) throw new Error(out.error);
        expect(out.clusterCount).toBe(1);
        expect(sandboxRuns).toBe(0); // default path never touched the sandbox

        // A custom-`code` call DOES use the sandbox — so a disabled executor surfaces as an error.
        const codeOut = await executeClusterIncidents(
            { incidentsEntryID: id, code: 'return cluster(Object.values(incidentsByEntry).flat());' },
            state,
        );
        expect('error' in codeOut).toBe(true);
        expect(sandboxRuns).toBeGreaterThan(0);
    });

    it('errors when custom `code` returns a non-clustering result', async () => {
        const state = createToolState(mockTrafficMap);
        const id = await seed(state, tightCluster(['a', 'b', 'c']));

        const out = await executeClusterIncidents(
            { incidentsEntryID: id, code: 'return { not: "a clustering output" };' },
            state,
        );

        expect('error' in out).toBe(true);
        // Nothing stored — the guard rejected the malformed result.
        expect(state.trafficIncidents.getClusters(id)).toBeUndefined();
    });

    it('re-runs on a monitor tick (replaceEntryData) and updates the stored clusters + emits clusters-change', async () => {
        const state = createToolState(mockTrafficMap);
        const id = await seed(state, tightCluster(['a', 'b', 'c']));
        await executeClusterIncidents({ incidentsEntryID: id }, state);
        expect(state.trafficIncidents.getClusters(id)?.groups[0].size).toBe(3);

        const changed: number[] = [];
        state.trafficIncidents.events.on('clusters-change', ({ clusters }) => {
            if (clusters) changed.push(clusters.groups[0]?.size ?? 0);
        });

        // A monitor-tick-style refresh: a 4th nearby incident + a newer sampledAt on the same entry.
        await state.trafficIncidents.replaceEntryData(id, tightCluster(['a', 'b', 'c', 'd']), 1000);
        await waitFor(() => state.trafficIncidents.getClusters(id)?.groups[0]?.size === 4);

        expect(state.trafficIncidents.getClusters(id)?.groups[0].size).toBe(4);
        expect(changed).toContain(4);
    });

    it('keeps stable cluster IDs across a tick (trend continuity)', async () => {
        const state = createToolState(mockTrafficMap);
        const id = await seed(state, tightCluster(['a', 'b', 'c']));
        await executeClusterIncidents({ incidentsEntryID: id }, state);
        const firstId = state.trafficIncidents.getClusters(id)?.groups[0].id;

        await state.trafficIncidents.replaceEntryData(id, tightCluster(['a', 'b', 'c', 'd']), 1000);
        await waitFor(() => state.trafficIncidents.getClusters(id)?.groups[0]?.size === 4);

        expect(state.trafficIncidents.getClusters(id)?.groups[0].id).toBe(firstId);
    });

    it('drops clustering when the source entry is removed', async () => {
        const state = createToolState(mockTrafficMap);
        const id = await seed(state, tightCluster(['a', 'b', 'c']));
        await executeClusterIncidents({ incidentsEntryID: id }, state);
        expect(state.trafficIncidents.getClusters(id)).toBeDefined();

        await state.trafficIncidents.removeEntry(id);
        expect(state.trafficIncidents.getClusters(id)).toBeUndefined();
    });

    it('clearClusters drops the record and emits clusters-change(null)', async () => {
        const state = createToolState(mockTrafficMap);
        const id = await seed(state, tightCluster(['a', 'b', 'c']));
        await executeClusterIncidents({ incidentsEntryID: id }, state);

        let cleared = false;
        state.trafficIncidents.events.on('clusters-change', ({ clusters }) => {
            if (clusters === null) cleared = true;
        });
        state.trafficIncidents.clearClusters(id);

        expect(state.trafficIncidents.getClusters(id)).toBeUndefined();
        expect(cleared).toBe(true);
    });
});

describe('clusterIncidents — code schema docs + scoping', () => {
    const codeDoc = (enabled: any, scope: any): string => {
        const shape = buildClusterIncidentsSchema(enabled, scope).shape as Record<string, { description?: string }>;
        return shape.code?.description ?? '';
    };

    it('documents the real incidents schema in the `code` field (so the model does not invent fields)', () => {
        const doc = codeDoc(['incidents'], undefined);
        // The TrafficIncident shape is spelled out — real field + its `properties` nesting + the primitive.
        expect(doc).toContain('delayInSeconds');
        expect(doc).toContain('feature.properties');
        expect(doc).toContain('cluster(');
    });

    it('defaults to incidents-only scope — no context input fields', () => {
        const shape = buildClusterIncidentsSchema(['incidents', 'places', 'routes'], undefined).shape as Record<
            string,
            unknown
        >;
        expect(shape.placesEntryIDs).toBeUndefined();
        expect(shape.routesEntryIDs).toBeUndefined();
        expect(shape.incidentsEntryID).toBeDefined();
    });

    it('widens to a context kind when scoped — adds its input field + schema docs', () => {
        const scope = { kinds: ['incidents', 'places'] as const };
        const shape = buildClusterIncidentsSchema(['incidents', 'places'], scope).shape as Record<string, unknown>;
        expect(shape.placesEntryIDs).toBeDefined();
        expect(codeDoc(['incidents', 'places'], scope)).toContain('places');
    });
});
