import { describe, expect, it } from 'vitest';
import { CustomGeometriesState } from '../state';

const mockMap = {} as any;

const feature = (id: string) =>
    ({
        type: 'Feature',
        id,
        geometry: {
            type: 'Polygon',
            coordinates: [
                [
                    [0, 0],
                    [1, 0],
                    [1, 1],
                    [0, 0],
                ],
            ],
        },
        properties: { name: id },
    }) as any;

const provenance = { operation: 'test', sourceIds: [] } as any;

describe('CustomGeometriesState — entry ids', () => {
    it('auto-increments fallback ids', async () => {
        const state = new CustomGeometriesState(mockMap);
        await state.addEntry([feature('a')], provenance, 'A');
        await state.addEntry([feature('b')], provenance, 'B');
        expect(state.entries.map((e) => e.id)).toEqual(['geometries-0', 'geometries-1']);
    });

    it('never reuses a surviving entry id after removals (add 3, remove first, add again)', async () => {
        const state = new CustomGeometriesState(mockMap);
        await state.addEntry([feature('a')], provenance, 'A'); // geometries-0
        await state.addEntry([feature('b')], provenance, 'B'); // geometries-1
        await state.addEntry([feature('c')], provenance, 'C'); // geometries-2
        await state.removeEntry('geometries-0');
        // entries.length is now 2, so the naive fallback would be `geometries-2` — a collision
        // with the surviving entry that breaks every id-based lookup for both of them.
        const newId = await state.addEntry([feature('d')], provenance, 'D');
        const ids = state.entries.map((e) => e.id);
        expect(new Set(ids).size).toBe(ids.length);
        expect(newId).not.toBe('geometries-2');
    });

    it('dedupes explicit ids with a numeric suffix', async () => {
        const state = new CustomGeometriesState(mockMap);
        const first = await state.addEntry([feature('a')], provenance, 'A', 'scan-area');
        const second = await state.addEntry([feature('b')], provenance, 'B', 'scan-area');
        expect(first).toBe('scan-area');
        expect(second).toBe('scan-area-2');
    });
});
