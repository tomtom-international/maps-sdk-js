import { describe, expect, it, vi } from 'vitest';
import { makeMockState } from '../../../tests/constants';
import { executeSetPitchBearing } from '../set-pitch-bearing';

describe('executeSetPitchBearing', () => {
    // With neither field given the runtime guard returns the exact error and never touches the map.
    it('returns an error and does not call easeTo when both are omitted', async () => {
        const state = makeMockState();
        state.baseMap.mapLibreMap.easeTo = vi.fn();

        const result = await executeSetPitchBearing({}, state);

        expect(result).toEqual({ error: 'Provide at least one of pitch or bearing' });
        expect(state.baseMap.mapLibreMap.easeTo).not.toHaveBeenCalled();
    });

    // Only pitch given → easeTo's argument carries a pitch key and NO bearing key (absent, not
    // merely undefined), which the conditional-spread build guarantees.
    it('passes only a pitch key when only pitch is given', async () => {
        const state = makeMockState();
        const easeTo = vi.fn();
        state.baseMap.mapLibreMap.easeTo = easeTo;

        const result = await executeSetPitchBearing({ pitch: 40 }, state);

        expect(result).toEqual({ success: true });
        expect(Object.keys(easeTo.mock.calls[0][0])).toEqual(['pitch']);
    });

    // Only bearing given → the reverse: a bearing key and no pitch key.
    it('passes only a bearing key when only bearing is given', async () => {
        const state = makeMockState();
        const easeTo = vi.fn();
        state.baseMap.mapLibreMap.easeTo = easeTo;

        await executeSetPitchBearing({ bearing: 90 }, state);

        expect(Object.keys(easeTo.mock.calls[0][0])).toEqual(['bearing']);
    });

    // Both given → both keys present with their values.
    it('passes both keys when both are given', async () => {
        const state = makeMockState();
        const easeTo = vi.fn();
        state.baseMap.mapLibreMap.easeTo = easeTo;

        await executeSetPitchBearing({ pitch: 40, bearing: 90 }, state);

        expect(easeTo.mock.calls[0][0]).toEqual({ pitch: 40, bearing: 90 });
    });

    // A throw is caught and surfaced with the exact error prefix.
    it('returns the exact error string when easeTo throws', async () => {
        const state = makeMockState();
        state.baseMap.mapLibreMap.easeTo = vi.fn(() => {
            throw new Error('cannot ease');
        });

        const result = await executeSetPitchBearing({ pitch: 40 }, state);

        expect(result).toEqual({ error: 'Failed to set pitch/bearing: cannot ease' });
    });
});
