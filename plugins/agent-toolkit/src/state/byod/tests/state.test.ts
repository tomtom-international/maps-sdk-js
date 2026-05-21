import type { FeatureCollection } from 'geojson';
import { describe, expect, it, vi } from 'vitest';
import { BYODState } from '../state';

const mockMap = {} as any;

const emptyFC: FeatureCollection = { type: 'FeatureCollection', features: [] };
const pointFC: FeatureCollection = {
    type: 'FeatureCollection',
    features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [4.89, 52.37] }, properties: {} }],
};

describe('BYODState', () => {
    it('addEntry assigns a fallback id and emits entries-change', async () => {
        const state = new BYODState(mockMap);
        const handler = vi.fn();
        state.events.on('entries-change', handler);

        const id = await state.addEntry(emptyFC, 'Sales territories');

        expect(id).toBe('byod-0');
        expect(state.entries).toHaveLength(1);
        expect(state.entries[0]).toMatchObject({ id: 'byod-0', label: 'Sales territories' });
        expect(state.entries[0].source).toEqual({ kind: 'integrator' });
        expect(handler).toHaveBeenCalledTimes(1);
    });

    it('addEntry uses explicitId and auto-suffixes collisions', async () => {
        const state = new BYODState(mockMap);
        await state.addEntry(emptyFC, 'a', { explicitId: 'territories' });
        await state.addEntry(emptyFC, 'b', { explicitId: 'territories' });

        expect(state.entries.map((entry) => entry.id)).toEqual(['territories', 'territories-2']);
    });

    it('addEntry routes the implicit fallback through `pickUniqueEntryId` so removals do not collide', async () => {
        // Regression for the Copilot review: previously `byod-${length}` collided after a remove
        // (add a, add b, remove a → length=1 and the new fallback `byod-1` clashes with `b`).
        const state = new BYODState(mockMap);
        const firstId = await state.addEntry(emptyFC, 'a'); // byod-0
        const secondId = await state.addEntry(emptyFC, 'b'); // byod-1
        expect([firstId, secondId]).toEqual(['byod-0', 'byod-1']);

        await state.removeEntry(firstId);
        const thirdId = await state.addEntry(emptyFC, 'c');
        // length is now 1 → fallback `byod-1` would collide; pickUniqueEntryId bumps to `byod-1-2`.
        expect(thirdId).toBe('byod-1-2');
        expect(state.entries.map((entry) => entry.id)).toEqual(['byod-1', 'byod-1-2']);
    });

    it('latestEntry returns the most recently added entry', async () => {
        const state = new BYODState(mockMap);
        expect(state.latestEntry).toBeUndefined();
        await state.addEntry(emptyFC, 'first');
        const secondId = await state.addEntry(emptyFC, 'second');
        expect(state.latestEntry?.id).toBe(secondId);
    });

    it('shownEntryIds tracks the per-entry `_shown` flag', async () => {
        const state = new BYODState(mockMap);
        const id = await state.addEntry(emptyFC, 'a');
        // Bypass `getEntryModule` for the unit test — the slice itself never reads `_module`
        // when computing `shownEntryIds`, so the `_shown` flag is the only source of truth.
        (state.entries.find((entry) => entry.id === id) as any)._shown = true;
        expect([...state.shownEntryIds]).toEqual([id]);
    });

    it('default layers are derived from the FeatureCollection geometry when none supplied', async () => {
        const state = new BYODState(mockMap);
        const id = await state.addEntry(pointFC, 'points');
        const entry = state.entries.find((e) => e.id === id);
        expect(entry?.layers.length).toBeGreaterThan(0);
        expect(entry?.layers.some((layer) => layer.type === 'circle')).toBe(true);
    });

    it('addEntry respects an explicit `layers` override', async () => {
        const state = new BYODState(mockMap);
        const overrides = [{ type: 'fill' as const, paint: { 'fill-color': '#abc' } }];
        const id = await state.addEntry(emptyFC, 'override', { layers: overrides });
        expect(state.entries.find((e) => e.id === id)?.layers).toEqual(overrides);
    });

    it('setEntryMode("single") trims older entries and emits entries-change', async () => {
        const state = new BYODState(mockMap);
        await state.addEntry(emptyFC, 'a');
        const latestId = await state.addEntry(emptyFC, 'b');
        const handler = vi.fn();
        state.events.on('entries-change', handler);

        await state.setEntryMode('single');

        expect(state.entries.map((entry) => entry.id)).toEqual([latestId]);
        expect(handler).toHaveBeenCalledTimes(1);
    });

    it('reset empties history and emits entries-change + shown-change', async () => {
        const state = new BYODState(mockMap);
        await state.addEntry(emptyFC, 'a');
        const entriesHandler = vi.fn();
        const shownHandler = vi.fn();
        state.events.on('entries-change', entriesHandler);
        state.events.on('shown-change', shownHandler);

        state.reset();

        expect(state.entries).toHaveLength(0);
        expect(entriesHandler).toHaveBeenCalledWith([]);
        expect(shownHandler).toHaveBeenCalledTimes(1);
    });
});
