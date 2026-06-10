import type { TrafficIncident } from '@tomtom-org/maps-sdk/core';
import { describe, expect, it } from 'vitest';
import { IncidentsAnalyses, runIncidentSpec } from '../analysis';

describe('runIncidentSpec', () => {
    it('passes incidents to the sandbox', async () => {
        const spec = {
            name: 'count',
            outputFormat: 'json' as const,
            code: 'return { count: incidents.length };',
            source: 'incidents-0',
        };
        const out = await runIncidentSpec(spec, [makeFakeIncident('a'), makeFakeIncident('b')], undefined, 0);
        expect(out).toEqual({ value: { count: 2 } });
    });

    it('returns an error when the code throws', async () => {
        const spec = { name: 'boom', outputFormat: 'json' as const, code: 'throw new Error("nope");', source: 'e' };
        const out = await runIncidentSpec(spec, [], undefined, 0);
        expect(out).toMatchObject({ error: expect.stringMatching(/nope/) });
    });

    it('rejects chart format when the result is not a Chart.js config', async () => {
        const spec = { name: 'bad', outputFormat: 'chart' as const, code: 'return { not: "chart" };', source: 'e' };
        const out = await runIncidentSpec(spec, [], undefined, 0);
        expect(out).toHaveProperty('error');
    });

    it('forwards `previous` to the sandbox; defaults to undefined on first run', async () => {
        const spec = {
            name: 'echo',
            outputFormat: 'json' as const,
            code: 'return { hadPrevious: previous !== undefined, previous: previous ?? null };',
            source: 'e',
        };
        const first = await runIncidentSpec(spec, [], undefined, 0);
        expect(first).toEqual({ value: { hadPrevious: false, previous: null } });
        const second = await runIncidentSpec(spec, [], { count: 7 }, 0);
        expect(second).toEqual({ value: { hadPrevious: true, previous: { count: 7 } } });
    });
});

describe('IncidentsAnalyses.register', () => {
    it('clears history when a spec is replaced with a different outputFormat or code', () => {
        const analyses = new IncidentsAnalyses();
        analyses.register({ name: 'clusters', outputFormat: 'json', code: 'return { groups: [] };', source: 'e' });
        analyses.attach({ name: 'clusters', timestamp: 1, outputFormat: 'json', data: { groups: [{ id: 'a' }] } });
        expect(analyses.results).toHaveLength(1);

        // Re-register under the same name with a different outputFormat — old json result
        // must not surface as the spec's "latest", since it belongs to the previous analysis.
        analyses.register({ name: 'clusters', outputFormat: 'chart', code: 'return { type: "bar" };', source: 'e' });
        expect(analyses.results).toHaveLength(0);
        expect(analyses.history('clusters')).toHaveLength(0);
    });

    it('preserves history on idempotent re-register (identical spec)', () => {
        const analyses = new IncidentsAnalyses();
        const spec = { name: 'clusters', outputFormat: 'json' as const, code: 'return { groups: [] };', source: 'e' };
        analyses.register(spec);
        analyses.attach({ name: 'clusters', timestamp: 1, outputFormat: 'json', data: { groups: [{ id: 'a' }] } });
        analyses.register({ ...spec });
        expect(analyses.history('clusters')).toHaveLength(1);
    });
});

describe('IncidentsAnalyses.registerDeterministic', () => {
    const run = () => ({ groups: [] });

    it('stores a deterministic spec', () => {
        const analyses = new IncidentsAnalyses();
        analyses.registerDeterministic({ name: 'clusters', source: 'e', signature: 'a', run });
        expect(analyses.specs).toHaveLength(1);
        expect(analyses.specs[0]).toMatchObject({ name: 'clusters' });
        expect('run' in analyses.specs[0]).toBe(true);
    });

    it('preserves history on idempotent re-register (unchanged signature)', () => {
        const analyses = new IncidentsAnalyses();
        analyses.registerDeterministic({ name: 'clusters', source: 'e', signature: 'a', run });
        analyses.attach({ name: 'clusters', timestamp: 1, outputFormat: 'json', data: { groups: [] } });
        analyses.registerDeterministic({ name: 'clusters', source: 'e', signature: 'a', run });
        expect(analyses.history('clusters')).toHaveLength(1);
    });

    it('clears history when the signature changes', () => {
        const analyses = new IncidentsAnalyses();
        analyses.registerDeterministic({ name: 'clusters', source: 'e', signature: 'a', run });
        analyses.attach({ name: 'clusters', timestamp: 1, outputFormat: 'json', data: { groups: [] } });
        analyses.registerDeterministic({ name: 'clusters', source: 'e', signature: 'b', run });
        expect(analyses.history('clusters')).toHaveLength(0);
    });

    it('replaces a code spec with a deterministic spec (clears history)', () => {
        const analyses = new IncidentsAnalyses();
        analyses.register({ name: 'clusters', outputFormat: 'json', code: 'return {}', source: 'e' });
        analyses.attach({ name: 'clusters', timestamp: 1, outputFormat: 'json', data: {} });
        analyses.registerDeterministic({ name: 'clusters', source: 'e', signature: 'a', run });
        expect(analyses.history('clusters')).toHaveLength(0);
        expect('run' in analyses.specs[0]).toBe(true);
    });
});

describe('IncidentsAnalyses.replay with mixed specs', () => {
    it('replays a deterministic spec via its run callback', async () => {
        const analyses = new IncidentsAnalyses();
        analyses.registerDeterministic({
            name: 'size',
            source: 'e',
            run: (data) => ({ n: data.length }),
        });
        const results = await analyses.replay([makeFakeIncident('a'), makeFakeIncident('b')], 0);
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('size');
        expect(results[0].data).toEqual({ n: 2 });
    });

    it('replays both code and deterministic specs, preserving registration order', async () => {
        const analyses = new IncidentsAnalyses();
        analyses.register({
            name: 'count',
            outputFormat: 'json',
            code: 'return { count: incidents.length };',
            source: 'e',
        });
        analyses.registerDeterministic({ name: 'det', source: 'e', run: (data) => ({ n: data.length }) });
        const results = await analyses.replay([], 0);
        expect(results).toHaveLength(2);
        expect(results.map((r) => r.name)).toEqual(['count', 'det']);
    });

    it('threads the previous result and sampledAt into run', async () => {
        const analyses = new IncidentsAnalyses();
        analyses.registerDeterministic({
            name: 'echo',
            source: 'e',
            run: (_data, { previous, sampledAt }) => ({ hadPrevious: previous !== undefined, sampledAt }),
        });
        const first = await analyses.replay([], 10);
        expect(first[0].data).toEqual({ hadPrevious: false, sampledAt: 10 });
        const second = await analyses.replay([], 20);
        expect(second[0].data).toEqual({ hadPrevious: true, sampledAt: 20 });
    });

    it('skips a throwing deterministic spec without breaking the tick', async () => {
        const analyses = new IncidentsAnalyses();
        analyses.registerDeterministic({
            name: 'boom',
            source: 'e',
            run: () => {
                throw new Error('nope');
            },
        });
        analyses.register({ name: 'count', outputFormat: 'json', code: 'return { count: 1 };', source: 'e' });
        const results = await analyses.replay([], 0);
        expect(results.map((r) => r.name)).toEqual(['count']);
    });
});

function makeFakeIncident(id: string): TrafficIncident {
    return {
        type: 'Feature',
        id,
        geometry: { type: 'Point', coordinates: [0, 0] },
        properties: { id, category: 'jam', magnitudeOfDelay: 'moderate', timeValidity: 'present', events: [] },
    } as unknown as TrafficIncident;
}
