import { describe, expect, it, vi } from 'vitest';
import { makeMockState } from '../../../tests/constants';
import { executeFlyTo } from '../fly-to';

// Only asserts fitBounds/flyTo were called correctly — a real map (with real getBounds/getCenter)
// needs a live WebGL canvas, which doesn't exist in this Node test environment.
describe('executeFlyTo', () => {
    // The boundingBox branch calls fitBounds with the bbox and a padding option that defaults
    // to 50 when the caller omits it.
    it('calls fitBounds with the default padding when padding is omitted', async () => {
        const state = makeMockState();
        state.baseMap.mapLibreMap.fitBounds = vi.fn();

        const result = await executeFlyTo({ where: { boundingBox: [0, 1, 2, 3] } }, state);

        expect(result).toEqual({ success: true });
        expect(state.baseMap.mapLibreMap.fitBounds).toHaveBeenCalledWith([0, 1, 2, 3], { padding: 50 });
    });

    // An explicit padding is forwarded verbatim instead of the 50 default.
    it('forwards an explicit padding to fitBounds', async () => {
        const state = makeMockState();
        state.baseMap.mapLibreMap.fitBounds = vi.fn();

        await executeFlyTo({ where: { boundingBox: [0, 1, 2, 3], padding: 120 } }, state);

        expect(state.baseMap.mapLibreMap.fitBounds).toHaveBeenCalledWith([0, 1, 2, 3], { padding: 120 });
    });

    // The position branch calls flyTo with the center and a zoom that defaults to 14.
    it('calls flyTo with the default zoom when zoom is omitted', async () => {
        const state = makeMockState();
        state.baseMap.mapLibreMap.flyTo = vi.fn();

        const result = await executeFlyTo({ where: { position: [4.9, 52.4] } }, state);

        expect(result).toEqual({ success: true });
        expect(state.baseMap.mapLibreMap.flyTo).toHaveBeenCalledWith({ center: [4.9, 52.4], zoom: 14 });
    });

    // An explicit zoom is forwarded verbatim instead of the 14 default.
    it('forwards an explicit zoom to flyTo', async () => {
        const state = makeMockState();
        state.baseMap.mapLibreMap.flyTo = vi.fn();

        await executeFlyTo({ where: { position: [4.9, 52.4], zoom: 9 } }, state);

        expect(state.baseMap.mapLibreMap.flyTo).toHaveBeenCalledWith({ center: [4.9, 52.4], zoom: 9 });
    });

    // A thrown map error is caught and surfaced with the exact flyTo error prefix.
    it('returns the exact error string when the map call throws', async () => {
        const state = makeMockState();
        state.baseMap.mapLibreMap.fitBounds = vi.fn(() => {
            throw new Error('bad bounds');
        });

        const result = await executeFlyTo({ where: { boundingBox: [0, 1, 2, 3] } }, state);

        expect(result).toEqual({ error: 'flyTo failed: bad bounds' });
    });
});
