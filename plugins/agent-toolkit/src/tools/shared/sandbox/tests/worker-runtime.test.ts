import { describe, expect, it } from 'vitest';
import { WORKER_PROVIDED_PARAMS } from '../../sandbox-code';
import { assembleWorkerSource, partitionSandboxArgs } from '../worker-runtime';

describe('partitionSandboxArgs', () => {
    it('keeps cloneable DATA args by index and drops worker-provided lib args', () => {
        const places = { type: 'FeatureCollection', features: [] };
        const turf = { area: () => 0 };
        const h3 = { latLngToCell: () => '' };

        const { dataByIndex } = partitionSandboxArgs(['places', 'turf', 'h3'], [places, turf, h3]);

        // `turf` (index 1) and `h3` (index 2) are worker-provided → dropped.
        expect(dataByIndex).toEqual({ 0: places });
    });

    it('drops every worker-provided param name', () => {
        const names = [...WORKER_PROVIDED_PARAMS, 'incidents'];
        // One arg per name; the trailing `incidents` is the only cloneable DATA arg.
        const args = names.map((_, index) => (index === names.length - 1 ? [1, 2] : {}));
        const { dataByIndex } = partitionSandboxArgs(names, args);
        // Only the trailing `incidents` data survives.
        expect(Object.keys(dataByIndex)).toEqual([String(names.length - 1)]);
        expect(dataByIndex[names.length - 1]).toEqual([1, 2]);
    });
});

describe('assembleWorkerSource', () => {
    it('prefixes the library source and appends the worker message loop', () => {
        const source = assembleWorkerSource('self.turf = {}; self.h3 = {};');
        expect(source.startsWith('self.turf = {}; self.h3 = {};')).toBe(true);
        expect(source).toContain('self.onmessage');
        // The runtime compiles user code via AsyncFunction and reports results by id.
        expect(source).toContain('AsyncFunction');
        expect(source).toContain("type: 'result'");
    });
});
