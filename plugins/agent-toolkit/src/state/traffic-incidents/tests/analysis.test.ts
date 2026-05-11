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

function makeFakeIncident(id: string): TrafficIncident {
    return {
        type: 'Feature',
        id,
        geometry: { type: 'Point', coordinates: [0, 0] },
        properties: { id, category: 'jam', magnitudeOfDelay: 'moderate', timeValidity: 'present', events: [] },
    } as unknown as TrafficIncident;
}
