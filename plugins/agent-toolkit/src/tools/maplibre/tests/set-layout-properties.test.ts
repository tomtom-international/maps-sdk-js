import { describe, expect, it, vi } from 'vitest';
import { makeMockState } from '../../../tests/constants';
import { executeSetLayoutProperties } from '../set-layout-properties';

describe('executeSetLayoutProperties', () => {
    // Each change calls setLayoutProperty with its layerId/propertyName/value and reports success.
    it('applies every change and reports success', async () => {
        const state = makeMockState();
        state.baseMap.mapLibreMap.setLayoutProperty = vi.fn();

        const result = await executeSetLayoutProperties(
            {
                changes: [
                    { layerId: 'water', propertyName: 'visibility', value: 'none' },
                    { layerId: 'road', propertyName: 'icon-size', value: 2 },
                ],
            },
            state,
        );
        if ('error' in result) {
            expect.fail('expected executeSetLayoutProperties to succeed');
        }

        expect(state.baseMap.mapLibreMap.setLayoutProperty).toHaveBeenCalledWith('water', 'visibility', 'none');
        expect(state.baseMap.mapLibreMap.setLayoutProperty).toHaveBeenCalledWith('road', 'icon-size', 2);
        expect(result.results).toEqual([
            { layerId: 'water', propertyName: 'visibility', value: 'none', success: true },
            { layerId: 'road', propertyName: 'icon-size', value: 2, success: true },
        ]);
    });
});
