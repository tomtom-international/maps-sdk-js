import { describe, expect, it } from 'vitest';
import type { ToolState } from '../../../types';
import { findPlacesByEntry } from '../state-inputs';

describe('findPlacesByEntry', () => {
    const mockState = (entries: { id: string; places: unknown[] }[]) =>
        ({
            places: { entries },
        }) as unknown as ToolState;

    it('returns `undefined` when ids list is undefined', () => {
        const result = findPlacesByEntry(undefined, mockState([]));
        expect(result).toEqual({ value: undefined });
    });

    it('returns `undefined` when ids list is empty', () => {
        const result = findPlacesByEntry([], mockState([]));
        expect(result).toEqual({ value: undefined });
    });

    it('builds a Record<id, Places> for each requested entry', () => {
        const placeA = { id: 'a' };
        const placeB = { id: 'b' };
        const state = mockState([
            { id: 'entry-1', places: [placeA] },
            { id: 'entry-2', places: [placeB] },
        ]);
        const result = findPlacesByEntry(['entry-1', 'entry-2'], state);
        expect(result).toEqual({
            value: {
                'entry-1': { type: 'FeatureCollection', features: [placeA] },
                'entry-2': { type: 'FeatureCollection', features: [placeB] },
            },
        });
    });

    it('errors with a recallPlaces hint when an id is unknown', () => {
        const state = mockState([{ id: 'entry-1', places: [] }]);
        const result = findPlacesByEntry(['entry-missing'], state);
        expect(result).toEqual({
            error: 'No places entry found with id "entry-missing". Use recallPlaces to list available IDs.',
        });
    });
});
