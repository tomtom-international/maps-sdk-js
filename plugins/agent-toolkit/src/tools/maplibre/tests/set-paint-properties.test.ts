import { describe, expect, it, vi } from 'vitest';
import { makeMockState } from '../../../tests/constants';
import { executeSetPaintProperties } from '../set-paint-properties';

describe('executeSetPaintProperties', () => {
    // Each change calls setPaintProperty with its layerId/propertyName/value and reports success.
    it('applies every change and reports success', async () => {
        const state = makeMockState();
        state.baseMap.mapLibreMap.setPaintProperty = vi.fn();

        const result = await executeSetPaintProperties(
            {
                changes: [
                    { layerId: 'water', propertyName: 'fill-color', value: '#00f' },
                    { layerId: 'road', propertyName: 'line-width', value: 3 },
                ],
            },
            state,
        );
        if ('error' in result) {
            expect.fail('expected executeSetPaintProperties to succeed');
        }

        expect(state.baseMap.mapLibreMap.setPaintProperty).toHaveBeenCalledWith('water', 'fill-color', '#00f');
        expect(state.baseMap.mapLibreMap.setPaintProperty).toHaveBeenCalledWith('road', 'line-width', 3);
        expect(result.results).toEqual([
            { layerId: 'water', propertyName: 'fill-color', value: '#00f', success: true },
            { layerId: 'road', propertyName: 'line-width', value: 3, success: true },
        ]);
    });
});
