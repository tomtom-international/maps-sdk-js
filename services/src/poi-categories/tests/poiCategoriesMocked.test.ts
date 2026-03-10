import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { mockFetchResponse } from '../../shared/tests/fetchMockUtils';
import { getPOICategories, getPOICategoryCodes } from '..';
import * as cache from '../cache';

const mockApiResponse = {
    poiCategories: [
        { id: 7315, name: 'Restaurant', synonyms: ['Eating Out', 'Dining'], childCategoryIds: [7315025] },
        { id: 7315025, name: 'Italian Restaurant', synonyms: [], childCategoryIds: [] },
        {
            id: 7314,
            name: 'Hotel',
            synonyms: ['Motel', 'Inn', 'Bed and Breakfast'],
            childCategoryIds: [7314003, 7314006],
        },
        { id: 7314003, name: 'Boutique Hotel', synonyms: [], childCategoryIds: [] },
        { id: 7314006, name: 'Motel', synonyms: [], childCategoryIds: [] },
        { id: 7320, name: 'Sports Center', synonyms: ['Gym', 'Fitness Center'], childCategoryIds: [] },
        { id: 7383, name: 'Airport', synonyms: ['Aerodrome'], childCategoryIds: [] },
    ],
};

describe('POI categories caching and filtering', () => {
    beforeEach(() => {
        vi.spyOn(cache, 'getCachedCategories').mockReturnValue(undefined);
        mockFetchResponse(200, mockApiResponse);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('returns all categories when no filters are provided', async () => {
        const { poiCategories: results } = await getPOICategories();
        expect(results).toHaveLength(7);
    });

    test('a second call for the same language does not make another fetch', async () => {
        const fetchSpy = vi.spyOn(global, 'fetch');
        await getPOICategories();
        // Simulate a warm cache so the second call skips the fetch
        vi.mocked(cache.getCachedCategories).mockReturnValue([]);
        await getPOICategories();
        expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    test('filters matches categories whose name contains the needle', async () => {
        const { poiCategories: results } = await getPOICategories({ filters: ['hotel'] });
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Hotel');
    });

    test('filters matches categories whose synonym contains the needle', async () => {
        const { poiCategories: results } = await getPOICategories({ filters: ['gym'] });
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Sports Center');
    });

    test('filters match when normalized filter is a substring of a normalized name or synonym', async () => {
        // 'eating out' normalizes to 'eatingout', which matches the synonym 'Eating Out' → 'eatingout'
        const { poiCategories: results } = await getPOICategories({ filters: ['eating out'] });
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Restaurant');
    });

    test('filters do not match when normalized input spans words from different names or synonyms', async () => {
        // 'gym center' normalizes to 'gymcenter', which is neither a substring of 'gym' nor 'fitnesscenter' nor 'sportscenter'
        const { poiCategories: results } = await getPOICategories({ filters: ['gym center'] });
        expect(results).toHaveLength(0);
    });

    test('filters are case-insensitive', async () => {
        const { poiCategories: lower } = await getPOICategories({ filters: ['dining'] });
        const { poiCategories: upper } = await getPOICategories({ filters: ['DINING'] });
        expect(lower).toHaveLength(1);
        expect(upper).toHaveLength(1);
        expect(lower[0].name).toBe(upper[0].name);
    });

    test('multiple filters return the merged and deduplicated union', async () => {
        const { poiCategories: results } = await getPOICategories({ filters: ['hotel', 'gym'] });
        expect(results).toHaveLength(2);
        const names = results.map((category) => category.name);
        expect(names).toContain('Hotel');
        expect(names).toContain('Sports Center');
    });

    test('filters returns empty array when no category matches', async () => {
        const { poiCategories: results } = await getPOICategories({ filters: ['zzznomatch'] });
        expect(results).toHaveLength(0);
    });

    test('poiCategoryCodes returns a flat array of all codes when no filter is given', async () => {
        const codes = await getPOICategoryCodes();
        expect(codes).toEqual([
            'RESTAURANT',
            'ITALIAN_RESTAURANT',
            'HOTEL_MOTEL',
            'HOTEL',
            'MOTEL',
            'SPORTS_CENTER',
            'AIRPORT',
        ]);
    });

    test('poiCategoryCodes with a filter returns only the matching codes', async () => {
        const codes = await getPOICategoryCodes({ filters: ['gym'] });
        expect(codes).toEqual(['SPORTS_CENTER']);
    });

    test('poiCategoryCodes with a filter returns only the main category matching code', async () => {
        const codes = await getPOICategoryCodes({ filters: ['dining'] });
        expect(codes).toEqual(['RESTAURANT']);
    });
});

describe('parent-child pruning', () => {
    beforeEach(() => {
        vi.spyOn(cache, 'getCachedCategories').mockReturnValue(undefined);
        mockFetchResponse(200, {
            poiCategories: [
                { id: 7315, name: 'Restaurant', synonyms: ['Dining'], childCategoryIds: [7315025] },
                { id: 7315025, name: 'Italian Restaurant', synonyms: [], childCategoryIds: [] },
            ],
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('suppresses child when its parent also matched the filter', async () => {
        // 'restaurant' matches both 'Restaurant' and 'Italian Restaurant',
        // but the child should be pruned because its parent already implies it.
        const { poiCategories: results } = await getPOICategories({ filters: ['restaurant'] });
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Restaurant');
    });

    test('returns child when only it matches, not its parent', async () => {
        const { poiCategories: results } = await getPOICategories({ filters: ['italian'] });
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Italian Restaurant');
    });
});
