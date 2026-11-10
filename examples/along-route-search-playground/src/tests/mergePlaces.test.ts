import { describe, expect, it } from 'vitest';
import { mergePlaces } from '../mergePlaces';

const page = (ids: string[]) => ({
    features: ids.map((id) => ({ id })),
});

const idsOf = (result: { features: { id?: string | number }[] }) => result.features.map((feature) => feature.id);

describe('mergePlaces', () => {
    it('takes turns, so a full first stretch cannot crowd out the next', () => {
        const first = page(['a1', 'a2', 'a3', 'a4']);
        const second = page(['b1', 'b2']);

        expect(idsOf(mergePlaces([first, second], 4))).toEqual(['a1', 'b1', 'a2', 'b2']);
    });

    it('skips a place a stretch already contributed and keeps going', () => {
        const merged = mergePlaces([page(['a1', 'shared']), page(['shared', 'b1'])], 3);

        expect(idsOf(merged)).toEqual(['a1', 'shared', 'b1']);
    });

    it('stops at the limit and rejects a search with no stretch', () => {
        expect(idsOf(mergePlaces([page(['a1', 'a2', 'a3'])], 2))).toEqual(['a1', 'a2']);
        expect(() => mergePlaces([], 2)).toThrow('Along-route search had no stretch to query.');
    });
});
