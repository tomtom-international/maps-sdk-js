import type { StyleSpecification } from 'maplibre-gl';
import { describe, expect, it, vi } from 'vitest';
import { makeMockState } from '../../../tests/constants';
import { executeGetMapStyleLayers } from '../get-map-style-layers';

const styleLayers = [
    { id: 'water', type: 'fill', paint: { 'fill-color': '#00f' }, layout: { visibility: 'visible' } },
    { id: 'road-label', type: 'symbol', paint: { 'text-color': '#000' }, layout: { 'text-size': 12 } },
    { id: 'Water-outline', type: 'line', paint: { 'line-color': '#009' }, layout: { visibility: 'visible' } },
];

const stateWithLayers = () => {
    const state = makeMockState();
    state.baseMap.mapLibreMap.getStyle = vi.fn(() => ({ layers: styleLayers }) as StyleSpecification);
    return state;
};

describe('executeGetMapStyleLayers', () => {
    // A layerIdQuery is a case-insensitive substring filter — 'water' matches both 'water' and
    // 'Water-outline' but not 'road-label'.
    it('filters layers by a case-insensitive substring query', async () => {
        const result = await executeGetMapStyleLayers({ layerIdQuery: 'water', include: [] }, stateWithLayers());
        if ('error' in result) {
            expect.fail('expected executeGetMapStyleLayers to succeed');
        }

        expect(result.layers.map((l) => l.id)).toEqual(['water', 'Water-outline']);
    });

    // A query matching no layer id returns the exact "no layers" error.
    it('returns the exact error when the query matches no layers', async () => {
        const result = await executeGetMapStyleLayers({ layerIdQuery: 'zzz', include: [] }, stateWithLayers());

        expect(result).toEqual({ error: 'No layers found matching query: "zzz"' });
    });

    // include: ['paint'] → each layer object carries id + paint but NOT layout.
    it('includes only paint when include is ["paint"]', async () => {
        const result = await executeGetMapStyleLayers({ layerIdQuery: 'water', include: ['paint'] }, stateWithLayers());
        if ('error' in result) {
            expect.fail('expected executeGetMapStyleLayers to succeed');
        }

        expect(Object.keys(result.layers[0]).sort((a, b) => a.localeCompare(b))).toEqual(['id', 'paint']);
    });

    // include: ['layout'] → id + layout but NOT paint.
    it('includes only layout when include is ["layout"]', async () => {
        const result = await executeGetMapStyleLayers(
            { layerIdQuery: 'water', include: ['layout'] },
            stateWithLayers(),
        );
        if ('error' in result) {
            expect.fail('expected executeGetMapStyleLayers to succeed');
        }

        expect(Object.keys(result.layers[0]).sort((a, b) => a.localeCompare(b))).toEqual(['id', 'layout']);
    });

    // include: ['paint','layout'] → all three keys.
    it('includes both when include is ["paint","layout"]', async () => {
        const result = await executeGetMapStyleLayers(
            { layerIdQuery: 'water', include: ['paint', 'layout'] },
            stateWithLayers(),
        );
        if ('error' in result) {
            expect.fail('expected executeGetMapStyleLayers to succeed');
        }

        expect(Object.keys(result.layers[0]).sort((a, b) => a.localeCompare(b))).toEqual(['id', 'layout', 'paint']);
    });

    // A throw from getStyle is caught and surfaced with the exact error prefix.
    it('returns the exact error string when getStyle throws', async () => {
        const state = makeMockState();
        state.baseMap.mapLibreMap.getStyle = vi.fn(() => {
            throw new Error('no style');
        });

        const result = await executeGetMapStyleLayers({ include: [] }, state);

        expect(result).toEqual({ error: 'Failed to get style: no style' });
    });
});
