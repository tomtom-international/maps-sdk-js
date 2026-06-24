import { describe, expect, it } from 'vitest';
import type { ToolState } from '../../../types';
import { getRangePolygons } from '../resolve-range';

const polygon = (coordinates: number[][][]) => ({ type: 'Polygon' as const, coordinates });

// Minimal ToolState fake — getRangePolygons only reads `state.ranges.entries`.
const stateWith = (entries: unknown[]): ToolState => ({ ranges: { entries } }) as unknown as ToolState;

describe('getRangePolygons', () => {
    it('returns one outermost polygon per origin range', () => {
        const square = polygon([
            [
                [0, 0],
                [0, 1],
                [1, 1],
                [0, 0],
            ],
        ]);
        const state = stateWith([
            {
                id: 'ranges-0',
                ranges: [
                    { polygon: { features: [{ geometry: square }, { geometry: polygon([]) }] } },
                    { polygon: { features: [{ geometry: square }] } },
                ],
            },
        ]);

        const result = getRangePolygons(state, 'ranges-0');

        // features[0] only (largest budget), one per origin range.
        expect(result).toEqual({ polygons: [square, square] });
    });

    it('errors when the range id is unknown', () => {
        const result = getRangePolygons(stateWith([{ id: 'ranges-0', ranges: [] }]), 'ranges-9');

        expect(result).toEqual({ error: expect.stringContaining('Range "ranges-9" not found') });
    });

    it('errors when the entry exists but holds no polygons', () => {
        const state = stateWith([{ id: 'ranges-0', ranges: [{ polygon: undefined }] }]);

        const result = getRangePolygons(state, 'ranges-0');

        expect(result).toEqual({ error: expect.stringContaining('Range "ranges-0" has no polygons') });
    });
});
