import { describe, expect, it, vi } from 'vitest';
import { makeMockState } from '../../../tests/constants';
import { executeZoomInOrOut } from '../zoom-in-or-out';

describe('executeZoomInOrOut', () => {
    // A positive delta is added to the current zoom, zoomTo is called with that target, and the
    // returned zoom echoes it.
    it('zooms in by a positive delta', async () => {
        const state = makeMockState();
        state.baseMap.mapLibreMap.getZoom = vi.fn(() => 10);
        state.baseMap.mapLibreMap.zoomTo = vi.fn();

        const result = await executeZoomInOrOut({ delta: 2 }, state);

        expect(state.baseMap.mapLibreMap.zoomTo).toHaveBeenCalledWith(12);
        expect(result).toEqual({ zoom: 12 });
    });

    // A negative delta subtracts from the current zoom.
    it('zooms out by a negative delta', async () => {
        const state = makeMockState();
        state.baseMap.mapLibreMap.getZoom = vi.fn(() => 10);
        state.baseMap.mapLibreMap.zoomTo = vi.fn();

        const result = await executeZoomInOrOut({ delta: -3 }, state);

        expect(state.baseMap.mapLibreMap.zoomTo).toHaveBeenCalledWith(7);
        expect(result).toEqual({ zoom: 7 });
    });

    // A throw is caught and surfaced with the exact zoom error prefix.
    it('returns the exact error string when the map call throws', async () => {
        const state = makeMockState();
        state.baseMap.mapLibreMap.getZoom = vi.fn(() => {
            throw new Error('no zoom');
        });

        const result = await executeZoomInOrOut({ delta: 1 }, state);

        expect(result).toEqual({ error: 'Zoom failed: no zoom' });
    });
});
