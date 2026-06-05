import type { FeatureCollection } from 'geojson';
import { describe, expect, it, vi } from 'vitest';
import { createToolState } from '../../../state';
import type { ToolState } from '../../../types';
import { executeSetByodLayers } from '../set-byod-layers';

const mockMap = { mapLibreMap: { getSource: () => undefined, getLayer: () => undefined } } as any;

const pointFC: FeatureCollection = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [4.89, 52.37] }, properties: { revenue: 100 } },
    ],
};

describe('setByodLayers', () => {
    it('replaces the layers on a stored (hidden) entry and echoes the new layer types', async () => {
        const state: ToolState = createToolState(mockMap);
        const id = await state.byod.addEntry(pointFC, 'customer pins');

        const out = await executeSetByodLayers(
            {
                byodEntryId: id,
                layers: [{ type: 'circle', paint: { 'circle-radius': 12, 'circle-color': '#d62728' } }],
            },
            state,
        );

        if ('error' in out) throw new Error(out.error);
        expect(out).toMatchObject({ byodEntryId: id, label: 'customer pins', layerCount: 1, layerTypes: ['circle'] });
        // No `show` was requested → no render report.
        expect(out.shown).toBeUndefined();
        const entry = state.byod.entries.find((e) => e.id === id);
        expect(entry?.layers).toEqual([{ type: 'circle', paint: { 'circle-radius': 12, 'circle-color': '#d62728' } }]);
    });

    it('applies new layers live to an already-shown entry without a `show` param', async () => {
        const state: ToolState = createToolState(mockMap);
        const id = await state.byod.addEntry(pointFC, 'customer pins');
        const entry = state.byod.entries.find((e) => e.id === id);
        // Simulate a shown entry: a live module receives the new specs via applyConfig.
        const applyConfig = vi.fn();
        (entry as any)._module = { applyConfig };
        (entry as any)._shown = true;

        const next = [{ type: 'circle' as const, paint: { 'circle-color': '#222831' } }];
        const out = await executeSetByodLayers({ byodEntryId: id, layers: next }, state);

        if ('error' in out) throw new Error(out.error);
        expect(applyConfig).toHaveBeenCalledWith({ sources: { data: { layers: next } } });
        // No `show` requested → no render report; the entry stays shown with the new layers.
        expect(out.shown).toBeUndefined();
        expect(state.byod.entries.find((e) => e.id === id)?.layers).toEqual(next);
    });

    it('renders the entry and reports the camera result when `show` is provided', async () => {
        const state: ToolState = createToolState(mockMap);
        const id = await state.byod.addEntry(pointFC, 'customer pins');
        const entry = state.byod.entries.find((e) => e.id === id);
        // Pre-seed a stub module so setEntryLayers + showEntry never touch real MapLibre.
        const applyConfig = vi.fn();
        const show = vi.fn(async () => {});
        (entry as any)._module = { applyConfig, show };

        const out = await executeSetByodLayers(
            {
                byodEntryId: id,
                layers: [{ type: 'circle', paint: { 'circle-radius': 6 } }],
                show: { zoomMode: 'none' },
            },
            state,
        );

        if ('error' in out) throw new Error(out.error);
        expect(applyConfig).toHaveBeenCalled();
        expect(show).toHaveBeenCalled();
        expect(out.shown).toEqual({ zoomMode: false });
        expect(state.byod.shownEntryIds.has(id)).toBe(true);
    });

    it('returns a semantic error for an unknown entry id', async () => {
        const state: ToolState = createToolState(mockMap);
        const out = await executeSetByodLayers({ byodEntryId: 'nope', layers: [{ type: 'circle' }] }, state);
        expect('error' in out && out.error).toMatch(/No BYOD entry with id "nope"/);
    });

    it('rolls back to the previous layers and reports an error when applying specs throws', async () => {
        const state: ToolState = createToolState(mockMap);
        const id = await state.byod.addEntry(pointFC, 'customer pins');
        const entry = state.byod.entries.find((e) => e.id === id);
        const previousLayers = entry?.layers;
        // Simulate a shown entry whose module rejects the new (and rollback) specs at apply time.
        (entry as any)._module = {
            applyConfig: () => {
                throw new Error('layers.0.paint.circle-radius: expected number, found string');
            },
        };

        const out = await executeSetByodLayers(
            { byodEntryId: id, layers: [{ type: 'circle', paint: { 'circle-radius': 'oops' } }] },
            state,
        );

        expect('error' in out && out.error).toMatch(/Failed to apply layers/);
        // The entry must keep its original styling — a bad restyle is never destructive.
        expect(state.byod.entries.find((e) => e.id === id)?.layers).toEqual(previousLayers);
    });
});
