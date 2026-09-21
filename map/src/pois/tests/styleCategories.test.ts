import { describe, expect, test } from 'vitest';
import { getStyleCategories } from '../POIsModule';

describe('getStyleCategories', () => {
    test('maps a category to the icon ID the base-map style uses', () => {
        expect(getStyleCategories(['RESTAURANT'])).toStrictEqual(['restaurant']);
    });

    test('expands a group into its categories, deduplicated', () => {
        const categoryIds = getStyleCategories(['ACCOMMODATION_GROUP']);

        expect(categoryIds).toContain('hotel_or_motel');
        expect(new Set(categoryIds).size).toBe(categoryIds.length);
    });

    test('drops a category the base-map style shows no icon for', () => {
        expect(getStyleCategories(['IMPORTANT_TOURIST_ATTRACTION'])).toStrictEqual([]);
    });

    test('keeps the categories that do map when another one in the same call does not', () => {
        expect(getStyleCategories(['IMPORTANT_TOURIST_ATTRACTION', 'RESTAURANT'])).toStrictEqual(['restaurant']);
    });
});
