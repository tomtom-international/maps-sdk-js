import type { CommonServiceParams } from '../../shared';
import type { PoiCategoriesResponseAPI } from './poiCategoriesResponseAPI';

/**
 * Parameters for the POI categories service.
 *
 * Results are cached in memory per language — the first call for a given language
 * fetches from the API; subsequent calls are served from the cache.
 *
 * @group POI Categories
 */
export type POICategoriesParams = CommonServiceParams<URL, PoiCategoriesResponseAPI> & {
    /**
     * One or more filter strings applied client-side against the text index.
     *
     * Each filter string is normalized (lowercased, spaces removed) and matched against
     * the normalized form of every `name` and synonym. A category matches when any of its
     * normalized texts contains the normalized filter as a substring.
     *
     * For example, `'gym'` matches a category whose name or synonym normalizes to `'gym'`
     * or `'fitnessandgym'`. `'italian restaurant'` normalizes to `'italianrestaurant'` and
     * matches `'Italian Restaurant'` but not `'Mexican Restaurant'`.
     *
     * Results from all filter strings are merged and deduplicated by `code`.
     * Omit to return all categories.
     *
     * @example
     * ```ts
     * // All categories (no filters)
     * {}
     *
     * // Categories matching "gym"
     * { filters: ['gym'] }
     *
     * // Categories matching either "gym" or "italian restaurant"
     * { filters: ['gym', 'italian restaurant'] }
     * ```
     */
    filters?: string[];
};
