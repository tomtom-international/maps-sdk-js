import type { FeatureCollection } from 'geojson';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BYODDataProfile, ByodSourceUrlValidator } from '../../../state/byod';
import type { ToolState } from '../../../types';
import { executeAddByodSource } from '../add-byod-source';

const profile: BYODDataProfile = { featureCount: 1, geometryTypes: ['Point'], properties: [] };

const featureCollection: FeatureCollection = {
    type: 'FeatureCollection',
    features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} }],
};

// Records addEntry calls so tests can assert the fetch path was (not) reached.
const mockState = (validator?: ByodSourceUrlValidator) => {
    const addEntry = vi.fn(async () => 'byod-0');
    const state = {
        byod: {
            sourceUrlValidator: validator,
            addEntry,
            findById: (id: string) => ({
                id,
                label: 'L',
                timestamp: 0,
                profile,
                source: { kind: 'url' as const, url: 'https://data.example.com/x.geojson' },
                data: featureCollection,
                _shown: false,
            }),
        },
    } as unknown as ToolState;
    return { state, addEntry };
};

// A fetch stub that always returns the FeatureCollection — used only on the "allowed" path.
const stubFetchOk = () =>
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        headers: { get: () => null },
        body: undefined,
        text: async () => JSON.stringify(featureCollection),
    } as unknown as Response);

afterEach(() => vi.restoreAllMocks());

describe('executeAddByodSource — sourceUrlValidator', () => {
    it('blocks the fetch when the validator returns { valid: false }', async () => {
        const fetchSpy = stubFetchOk();
        const { state, addEntry } = mockState(() => ({ valid: false, reason: 'Host not allowed.' }));

        const result = await executeAddByodSource({ label: 'X', url: 'https://evil.example/x.geojson' }, state);

        expect(result).toEqual({ error: 'Host not allowed.' });
        // The fetch must never happen, and nothing is committed to state.
        expect(fetchSpy).not.toHaveBeenCalled();
        expect(addEntry).not.toHaveBeenCalled();
    });

    it('passes the parsed URL to the validator and proceeds when it allows', async () => {
        const fetchSpy = stubFetchOk();
        const validator = vi.fn<ByodSourceUrlValidator>(() => ({ valid: true }));
        const { state, addEntry } = mockState(validator);

        const result = await executeAddByodSource({ label: 'X', url: 'https://data.example.com/x.geojson' }, state);

        // Validator received a URL instance pointing at the requested resource.
        expect(validator).toHaveBeenCalledTimes(1);
        expect(validator.mock.calls[0][0]).toBeInstanceOf(URL);
        expect(validator.mock.calls[0][0].href).toBe('https://data.example.com/x.geojson');
        // Allowed → fetch ran and the entry was created.
        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(addEntry).toHaveBeenCalledTimes(1);
        expect(result).toMatchObject({ byodEntryId: 'byod-0' });
    });

    it('supports an async validator (blocks on a rejected host)', async () => {
        const fetchSpy = stubFetchOk();
        const { state, addEntry } = mockState(async () => ({ valid: false, reason: 'Async: blocked.' }));

        const result = await executeAddByodSource({ label: 'X', url: 'https://evil.example/x.geojson' }, state);

        expect(result).toEqual({ error: 'Async: blocked.' });
        expect(fetchSpy).not.toHaveBeenCalled();
        expect(addEntry).not.toHaveBeenCalled();
    });

    it('does not invoke the validator on the inline-data path (nothing is fetched)', async () => {
        const validator = vi.fn<ByodSourceUrlValidator>(() => ({ valid: false, reason: 'should not run' }));
        const { state, addEntry } = mockState(validator);

        const result = await executeAddByodSource({ label: 'X', data: featureCollection }, state);

        expect(validator).not.toHaveBeenCalled();
        expect(addEntry).toHaveBeenCalledTimes(1);
        expect(result).toMatchObject({ byodEntryId: 'byod-0' });
    });
});
