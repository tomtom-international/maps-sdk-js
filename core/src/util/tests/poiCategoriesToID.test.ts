import { describe, expect, test } from 'vitest';
import { poiCategoriesToID, poiIDsToCategories } from '../poiCategoriesToID';

describe('POI Categories Mapping Tests', () => {
    test('every ID in poiIDsToCategories round-trips through poiCategoriesToID', () => {
        for (const category of Object.values(poiIDsToCategories)) {
            // The derived forward map must contain this category
            expect(poiCategoriesToID).toHaveProperty(category);
            // The forward map ID must also be present in the primary map and resolve to the same category
            // (it may be a smaller ID when multiple IDs share the same category — min wins)
            const forwardId = poiCategoriesToID[category];
            expect(poiIDsToCategories[forwardId]).toEqual(category);
        }
    });

    test('every category in poiCategoriesToID has its ID present in poiIDsToCategories', () => {
        for (const id of Object.values(poiCategoriesToID)) {
            expect(Object.keys(poiIDsToCategories)).toContain(String(id));
        }
    });
});
