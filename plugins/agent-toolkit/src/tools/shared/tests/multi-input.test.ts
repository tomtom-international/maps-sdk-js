import type { FeatureCollection } from 'geojson';
import { describe, expect, it } from 'vitest';
import type { ToolState } from '../../../types';
import { MULTI_INPUT_SANDBOX_PARAMS, packSandboxArgs, prepareMultiInputs } from '../multi-input';

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

// Only the slices `prepareMultiInputs` touches need to exist. Each is just `{ entries }`; the
// resolver short-circuits on omitted id arrays, so empty slices never get walked.
const mockState = (overrides: {
    byod?: ReturnType<typeof byodEntry>[];
    places?: { id: string; places: unknown[] }[];
}): ToolState =>
    ({
        places: { entries: overrides.places ?? [] },
        routing: { entries: [] },
        trafficIncidents: { entries: [] },
        trafficAreaAnalytics: { entries: [] },
        byod: { entries: overrides.byod ?? [] },
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
    it('merges requested byod entries into one FeatureCollection and a per-entry map', async () => {
        const state = mockState({ byod: [byodEntry('byod-0', 2), byodEntry('byod-1', 1)] });

        const prepared = expectValue(await prepareMultiInputs({ byodEntryIDs: ['byod-0', 'byod-1'] }, state));

        // Resolved entries are surfaced so analyseData can record the analysis against each one
        // (their ids feed the analysis record's `affectedEntryIds` in `state.analyses`).
        expect(prepared.resolved.byod.map((entry) => entry.id)).toEqual(['byod-0', 'byod-1']);
        // Merged view concatenates every entry's features.
        expect(prepared.sandbox.byod?.features).toHaveLength(3);
        // Per-entry view keeps them separable by id.
        expect(prepared.sandbox.byodByEntry?.['byod-0'].features).toHaveLength(2);
        expect(prepared.sandbox.byodByEntry?.['byod-1'].features).toHaveLength(1);
    });

    it('satisfies the "at least one input" guard with byod alone', async () => {
        const state = mockState({ byod: [byodEntry('byod-0', 1)] });
        const result = await prepareMultiInputs({ byodEntryIDs: ['byod-0'] }, state);
        expect('error' in result).toBe(false);
    });

    it('leaves byod sandbox views undefined when no byod ids are requested', async () => {
        const state = mockState({ places: [{ id: 'places-0', places: [] }] });

        const prepared = expectValue(await prepareMultiInputs({ placesEntryIDs: ['places-0'] }, state));

        expect(prepared.resolved.byod).toEqual([]);
        expect(prepared.sandbox.byod).toBeUndefined();
        expect(prepared.sandbox.byodByEntry).toBeUndefined();
    });

    it('errors with a recallState hint for an unknown byod id', async () => {
        const state = mockState({ byod: [byodEntry('byod-0', 1)] });
        const result = await prepareMultiInputs({ byodEntryIDs: ['missing'] }, state);
        expect(expectError(result)).toMatch(/No BYOD entry with id "missing".*recallState/);
    });
});

describe('packSandboxArgs — byod', () => {
    it('packs byod and byodByEntry at the positions named in MULTI_INPUT_SANDBOX_PARAMS', async () => {
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
        expect(args[MULTI_INPUT_SANDBOX_PARAMS.indexOf('byod')]).toBe(prepared.sandbox.byod);
        expect(args[MULTI_INPUT_SANDBOX_PARAMS.indexOf('byodByEntry')]).toBe(prepared.sandbox.byodByEntry);
        // Libs are passed through untouched.
        expect(args[MULTI_INPUT_SANDBOX_PARAMS.indexOf('h3')]).toBe(h3);
        expect(args[MULTI_INPUT_SANDBOX_PARAMS.indexOf('turf')]).toBe(turf);
    });
});
