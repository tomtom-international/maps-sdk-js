import type { Language, POICategory } from '@tomtom-org/maps-sdk/core';
import { mergeFromGlobal } from '@tomtom-org/maps-sdk/core';
import { callService } from '../shared/serviceTemplate';
import { getCachedCategories, getCachedTextEntries, normalizeText, setCachedCategories } from './cache';
import { poiCategoriesTemplate } from './poiCategoriesTemplate';
import type { POICategoriesParams, POICategoriesResponse, POICategoryResult } from './types';

/**
 * Filters cached categories for `language` against `filters` keyword strings.
 * Each filter is normalized and matched as a substring of category names and synonyms.
 * Results are merged, deduplicated by code, and pruned of child categories whose parent also matched.
 *
 * @param language - Language key for the cache lookup.
 * @param filters - Keyword strings to match against names and synonyms.
 */
const filterCategories = (language: Language | undefined, filters: string[]): POICategoryResult[] => {
    const cachedTextEntries = getCachedTextEntries(language);
    const resultsByCode = new Map<POICategory, POICategoryResult>();
    for (const filterTerm of filters) {
        const normalizedFilterInput = normalizeText(filterTerm);
        for (const [text, category] of Object.entries(cachedTextEntries)) {
            // if the category text includes the filter input, add the category to the results:
            if (text.includes(normalizedFilterInput)) {
                resultsByCode.set(category.code, category);
            }
        }
    }

    // Remove child categories whose parent also matched — the parent already implies them.
    for (const category of resultsByCode.values()) {
        for (const childCode of category.childCategoryCodes) {
            resultsByCode.delete(childCode);
        }
    }
    return [...resultsByCode.values()];
};

/**
 * Retrieve the list of POI category types supported by the TomTom Search API.
 *
 * The returned `code` values (`POICategory`) serve two purposes:
 * - Pass to `search({ poiCategories })` to filter search results by category.
 * - Pass to `POIsModule.filterCategories()` to filter the map's built-in POI icons.
 *   Generic parent codes (e.g. `'RESTAURANT'`) are supported there; overly specific child
 *   codes (e.g. `'ITALIAN_RESTAURANT'`) are not — use a parent or a `POICategoryGroup` instead.
 *
 * Results are cached in memory per language. The first call fetches from the API;
 * all subsequent calls — including filtered ones — are served from the cache.
 *
 * @param params - Optional parameters. Uses global `TomTomConfig` by default.
 *
 * @example
 * ```typescript
 * // All categories
 * const { poiCategories: all } = await getPOICategories();
 *
 * // Filtered by keyword, merged and deduplicated
 * const { poiCategories: gyms } = await getPOICategories({ filters: ['gym'] });
 * gyms.forEach(c => console.log(c.code, c.name, c.childCategoryCodes));
 * ```
 *
 * @group POI Categories
 */
export const getPOICategories = async (params: POICategoriesParams = {}): Promise<POICategoriesResponse> => {
    const { language } = mergeFromGlobal(params);

    let allCategories = getCachedCategories(language);

    if (!allCategories) {
        const response = await callService(params, poiCategoriesTemplate, 'POICategories');
        allCategories = response.poiCategories;
        setCachedCategories(language, allCategories);
    }

    if (params.filters?.length) {
        return { poiCategories: filterCategories(language, params.filters) };
    }

    return { poiCategories: allCategories };
};

/**
 * Convenience wrapper around {@link getPOICategories} that returns a flat array of `POICategory` codes.
 *
 * The returned codes serve two purposes:
 * - Pass to `search({ poiCategories })` to filter search results by category.
 * - Pass to `POIsModule.filterCategories()` to filter the map's built-in POI icons.
 *   Generic parent codes (e.g. `'RESTAURANT'`) are supported there; overly specific child
 *   codes (e.g. `'ITALIAN_RESTAURANT'`) are not — use a parent or a `POICategoryGroup` instead.
 *
 * Accepts the same parameters as {@link getPOICategories} — use `filters` to narrow by keyword.
 *
 * @param params - Optional parameters. Uses global `TomTomConfig` by default.
 *
 * @example
 * ```typescript
 * // All category codes
 * const codes = await getPOICategoryCodes();
 *
 * // Codes matching 'restaurant' — for search or generic map POI filtering
 * const restaurantCodes = await getPOICategoryCodes({ filters: ['restaurant'] });
 * ```
 *
 * @group POI Categories
 */
export const getPOICategoryCodes = async (params: POICategoriesParams = {}): Promise<POICategory[]> => {
    const { poiCategories: categories } = await getPOICategories(params);
    return categories.map((category) => category.code);
};
