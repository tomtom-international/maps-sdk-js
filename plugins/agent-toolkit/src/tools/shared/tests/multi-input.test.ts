import type { FeatureCollection } from 'geojson';
import { describe, expect, it } from 'vitest';
import type { ToolState } from '../../../types';
import {
    BY_ENTRY_VIEWS_DOC,
    buildSandboxToolsDoc,
    MULTI_INPUT_SANDBOX_PARAMS,
    packSandboxArgs,
    prepareMultiInputs,
} from '../multi-input';

// A minimal BYOD-shaped entry — `prepareMultiInputs` only reads `id` and `data`, so the
// profile/layers/module fields a real BYODEntry carries are irrelevant here.
const byodEntry = (id: string, featureCount: number) => ({
    id,
    data: {
        type: 'FeatureCollection',
        features: Array.from({ length: featureCount }, (_unused, index) => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [index, index] },
            properties: { entry: id, index },
        })),
    } as FeatureCollection,
});

// A minimal custom-geometries entry — `collectInputGeometries` only reads `id` and `features`
// (each polygon is then tagged with its `_source`), so the module/profile fields are irrelevant.
const customEntry = (id: string, polygonCount: number) => ({
    id,
    data: Array.from({ length: polygonCount }, (_unused, index) => ({
        type: 'Feature' as const,
        geometry: { type: 'Polygon' as const, coordinates: [[[index, index]]] },
        properties: { entry: id, index },
    })),
});

// Only the slices `prepareMultiInputs` touches need to exist. Each is just `{ entries }`; the
// resolver short-circuits on omitted id arrays, so empty slices never get walked.
const mockState = (overrides: {
    byod?: ReturnType<typeof byodEntry>[];
    places?: { id: string; data: unknown[] }[];
    custom?: ReturnType<typeof customEntry>[];
}): ToolState =>
    ({
        places: { entries: overrides.places ?? [] },
        routing: { entries: [] },
        trafficIncidents: { entries: [] },
        trafficAreaAnalytics: { entries: [] },
        byod: { entries: overrides.byod ?? [] },
        customGeometries: { findById: (id: string) => (overrides.custom ?? []).find((e) => e.id === id) },
    }) as unknown as ToolState;

const expectValue = <V>(result: { value: V } | { error: string }): V => {
    if ('error' in result) throw new Error(`expected value, got error: ${result.error}`);
    return result.value;
};
const expectError = (result: { value: unknown } | { error: string }): string => {
    if (!('error' in result)) throw new Error('expected error result');
    return result.error;
};

describe('prepareMultiInputs — byod', () => {
    it('exposes requested byod entries as a per-entry map keyed by id', async () => {
        const state = mockState({ byod: [byodEntry('byod-0', 2), byodEntry('byod-1', 1)] });

        const prepared = expectValue(await prepareMultiInputs({ byodEntryIDs: ['byod-0', 'byod-1'] }, state));

        // Resolved entries are surfaced so analyseData can record the analysis against each one
        // (their ids feed the analysis record's `affectedEntryIds` in `state.analyses`).
        expect(prepared.resolved.byod.map((entry) => entry.id)).toEqual(['byod-0', 'byod-1']);
        // The only sandbox view is per-entry, keyed by id — there is no flat/merged companion.
        expect(prepared.sandbox.byodByEntry?.['byod-0'].features).toHaveLength(2);
        expect(prepared.sandbox.byodByEntry?.['byod-1'].features).toHaveLength(1);
        expect(Object.keys(prepared.sandbox.byodByEntry ?? {})).toEqual(['byod-0', 'byod-1']);
    });

    it('passes live feature references (no clones) — the executor copies', async () => {
        const entry0 = byodEntry('byod-0', 2);
        const state = mockState({ byod: [entry0, byodEntry('byod-1', 1)] });

        const prepared = expectValue(await prepareMultiInputs({ byodEntryIDs: ['byod-0', 'byod-1'] }, state));

        // The per-entry view holds the SAME feature references as the live entry data — the deep-copy
        // is the executor's job (main-thread `structuredClone` / iframe-worker `postMessage`), done once.
        expect(prepared.sandbox.byodByEntry?.['byod-0'].features[0]).toBe(entry0.data.features[0]);
    });

    it('satisfies the "at least one input" guard with byod alone', async () => {
        const state = mockState({ byod: [byodEntry('byod-0', 1)] });
        const result = await prepareMultiInputs({ byodEntryIDs: ['byod-0'] }, state);
        expect('error' in result).toBe(false);
    });

    it('leaves the byod sandbox view undefined when no byod ids are requested', async () => {
        const state = mockState({ places: [{ id: 'places-0', data: [] }] });

        const prepared = expectValue(await prepareMultiInputs({ placesEntryIDs: ['places-0'] }, state));

        expect(prepared.resolved.byod).toEqual([]);
        expect(prepared.sandbox.byodByEntry).toBeUndefined();
    });

    it('errors with a recallState hint for an unknown byod id', async () => {
        const state = mockState({ byod: [byodEntry('byod-0', 1)] });
        const result = await prepareMultiInputs({ byodEntryIDs: ['missing'] }, state);
        expect(expectError(result)).toMatch(/No BYOD entry with id "missing".*recallState/);
    });
});

describe('prepareMultiInputs — geometriesByEntry', () => {
    it('partitions geometries by tagged source `${kind}:${id}`', async () => {
        const state = mockState({ custom: [customEntry('cg-0', 2), customEntry('cg-1', 1)] });

        const prepared = expectValue(
            await prepareMultiInputs(
                {
                    geometriesEntryIDs: [
                        { kind: 'customGeometries', id: 'cg-0' },
                        { kind: 'customGeometries', id: 'cg-1' },
                    ],
                },
                state,
            ),
        );

        // Per-source view is keyed by the COMPOSITE `${kind}:${id}` (not a bare id), since geometries mixes kinds.
        expect(Object.keys(prepared.sandbox.geometriesByEntry ?? {})).toEqual([
            'customGeometries:cg-0',
            'customGeometries:cg-1',
        ]);
        expect(prepared.sandbox.geometriesByEntry?.['customGeometries:cg-0']).toHaveLength(2);
        expect(prepared.sandbox.geometriesByEntry?.['customGeometries:cg-1']).toHaveLength(1);
        // Every grouped feature carries its `_source` tag (the basis for the partition).
        const grouped = Object.values(prepared.sandbox.geometriesByEntry ?? {}).flat();
        expect(grouped).toHaveLength(3);
        for (const feature of grouped) {
            expect(feature.properties?._source).toMatchObject({ kind: 'customGeometries' });
        }
    });

    it('leaves the geometries view undefined when no geometriesEntryIDs are requested', async () => {
        const state = mockState({ byod: [byodEntry('byod-0', 1)] });

        const prepared = expectValue(await prepareMultiInputs({ byodEntryIDs: ['byod-0'] }, state));

        expect(prepared.sandbox.geometriesByEntry).toBeUndefined();
    });
});

describe('packSandboxArgs — byod', () => {
    it('packs byodByEntry at the position named in MULTI_INPUT_SANDBOX_PARAMS', async () => {
        const state = mockState({ byod: [byodEntry('byod-0', 1)] });
        const prepared = expectValue(await prepareMultiInputs({ byodEntryIDs: ['byod-0'] }, state));

        const h3 = Symbol('h3');
        const turf = Symbol('turf');
        const args = packSandboxArgs(prepared.sandbox, { h3, turf });

        // Positional contract: each arg lines up with its name in MULTI_INPUT_SANDBOX_PARAMS.
        expect(args).toHaveLength(MULTI_INPUT_SANDBOX_PARAMS.length);
        // packSandboxArgs passes LIVE references — the deep-copy is the executor's job
        // (main-thread `structuredClone`, or iframe-worker `postMessage`), done once and
        // only where needed. See the executor's `cloneDataArg` test for the isolation guarantee.
        expect(args[MULTI_INPUT_SANDBOX_PARAMS.indexOf('byodByEntry')]).toBe(prepared.sandbox.byodByEntry);
        // Libs are passed through untouched.
        expect(args[MULTI_INPUT_SANDBOX_PARAMS.indexOf('h3')]).toBe(h3);
        expect(args[MULTI_INPUT_SANDBOX_PARAMS.indexOf('turf')]).toBe(turf);
    });
});

describe('buildSandboxToolsDoc — per-entry views', () => {
    it('always documents the per-entry inputs, regardless of scope', () => {
        // Ungated: present whether or not a per-call scope was committed, and independent of active kinds.
        expect(buildSandboxToolsDoc([], false)).toContain(BY_ENTRY_VIEWS_DOC);
        expect(buildSandboxToolsDoc(['places'], true)).toContain(BY_ENTRY_VIEWS_DOC);
    });

    it('names every per-entry record and the geometries `_source` fallback', () => {
        for (const name of ['placesByEntry', 'routesByEntry', 'incidentsByEntry']) {
            expect(BY_ENTRY_VIEWS_DOC).toContain(name);
        }
        expect(BY_ENTRY_VIEWS_DOC).toContain('properties._source');
    });
});
