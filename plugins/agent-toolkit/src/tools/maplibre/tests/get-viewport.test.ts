import type { BBox } from '@tomtom-org/maps-sdk/core';
import type { LngLat } from 'maplibre-gl';
import { describe, expect, it, vi } from 'vitest';
import { makeMockState } from '../../../tests/constants';
import { executeGetViewport } from '../get-viewport';

describe('executeGetViewport', () => {
    // center/zoom/pitch/bearing come off mapLibreMap; bbox comes off ttMap (a different object).
    // Verifies the exact field mapping from those five method calls into the result.
    it('maps the map and ttMap getters into the viewport result', async () => {
        const state = makeMockState();
        state.baseMap.mapLibreMap.getCenter = vi.fn((): LngLat => ({ toArray: () => [4.9, 52.4] }) as LngLat);
        state.baseMap.mapLibreMap.getZoom = vi.fn((): number => 12);
        state.baseMap.mapLibreMap.getPitch = vi.fn((): number => 30);
        state.baseMap.mapLibreMap.getBearing = vi.fn((): number => 45);
        state.baseMap.ttMap.getBBox = vi.fn((): BBox => [0, 1, 2, 3]);

        const result = await executeGetViewport({}, state);

        expect(result).toEqual({
            center: [4.9, 52.4],
            zoom: 12,
            bbox: [0, 1, 2, 3],
            pitch: 30,
            bearing: 45,
        });
    });

    // A throw in any of the reads is caught and surfaced with the exact viewport error prefix.
    it('returns the exact error string when a getter throws', async () => {
        const state = makeMockState();
        state.baseMap.mapLibreMap.getCenter = vi.fn(() => {
            throw new Error('no center');
        });

        const result = await executeGetViewport({}, state);

        expect(result).toEqual({ error: 'Failed to get viewport: no center' });
    });
});
