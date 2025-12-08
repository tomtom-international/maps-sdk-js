import { describe, expect, test } from 'vitest';
import { poiCategoriesToID, poiIDsToCategories } from '../poiCategoriesToID';

describe('POI Categories Mapping Tests', () => {
    test('poiCategoriesToID -> poiIDsToCategories', () => {
        for (const id of Object.values(poiCategoriesToID)) {
            expect(Object.keys(poiCategoriesToID)).toContain(String(poiIDsToCategories[id]));
        }
    });

    test('poiCategoriesToID -> poiCategoriesToID', () => {
        // For each category in poiCategoriesToID
        for (const [id, category] of Object.entries(poiIDsToCategories)) {
            expect(poiCategoriesToID[category]).toEqual(Number(id));
            expect(Object.keys(poiIDsToCategories)).toContain(String(poiCategoriesToID[category]));
        }
    });
});
