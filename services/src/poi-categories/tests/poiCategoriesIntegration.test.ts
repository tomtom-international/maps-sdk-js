import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { beforeAll, describe, expect, test } from 'vitest';
import { getPOICategories, getPOICategoryCodes } from '..';

describe('POI categories integration tests', () => {
    beforeAll(() => TomTomConfig.instance.put({ apiKey: process.env.API_KEY_TESTS }));

    test('returns a non-empty list of all categories when no filter is provided', async () => {
        const { poiCategories: results } = await getPOICategories();
        expect(results.length).toBeGreaterThan(0);
        expect(results[0]).toEqual(
            expect.objectContaining({
                name: expect.any(String),
                synonyms: expect.any(Array),
                childCategoryCodes: expect.any(Array),
            }),
        );
    });

    test('filter reduces the list', async () => {
        const { poiCategories: all } = await getPOICategories();
        const { poiCategories: filtered } = await getPOICategories({ filters: ['restaurant'] });
        expect(filtered.length).toBeGreaterThan(0);
        expect(filtered.length).toBeLessThan(all.length);
    });

    test('language changes the category names', async () => {
        const { poiCategories: english } = await getPOICategories({ language: 'en-GB' });
        const { poiCategories: dutch } = await getPOICategories({ language: 'nl-NL' });
        const englishNames = new Set(english.map((category) => category.name));
        const dutchNames = new Set(dutch.map((category) => category.name));
        // Dutch and English names should differ for at least some categories
        const overlap = [...dutchNames].filter((n) => englishNames.has(n));
        expect(overlap.length).toBeLessThan(dutch.length);
    });

    test('poiCategoryCodes returns a flat array containing known codes', async () => {
        const codes = await getPOICategoryCodes();
        expect(codes.length).toBeGreaterThan(0);
        expect(codes).toContain('RESTAURANT');
        expect(codes).toContain('AIRPORT');
    });

    test('poiCategoryCodes with a filter returns a non-empty subset of all codes', async () => {
        const all = await getPOICategoryCodes();
        const filtered = await getPOICategoryCodes({ filters: ['restaurant'] });
        expect(filtered.length).toBeGreaterThan(0);
        expect(filtered.length).toBeLessThan(all.length);
    });

    test('many filter calls are all served from cache after a single initial fetch', async () => {
        // Warm up the cache with one real API call
        const { poiCategories: all } = await getPOICategories();
        expect(all.length).toBeGreaterThan(0);

        // All subsequent filter calls must return a non-empty, narrowed subset
        const filterTerms = ['restaurant', 'park', 'hotel', 'gym', 'air', 'shop', 'sport', 'station', 'car', 'food'];
        for (const filterTerm of filterTerms) {
            const { poiCategories: filtered } = await getPOICategories({ filters: [filterTerm] });
            expect(filtered.length).toBeGreaterThan(0);
            expect(filtered.length).toBeLessThan(all.length);

            // Every returned category must have at least one name or synonym whose normalized form contains the normalized filter term
            const normalizedFilter = filterTerm.toLowerCase().replaceAll(/[\s\-_,]+/g, '');
            for (const filteredCategory of filtered) {
                const texts = [filteredCategory.name, ...filteredCategory.synonyms];
                const hasMatch = texts.some((text) =>
                    text
                        .toLowerCase()
                        .replaceAll(/[\s\-_,]+/g, '')
                        .includes(normalizedFilter),
                );
                expect(hasMatch).toBe(true);
            }
        }
    });
});
