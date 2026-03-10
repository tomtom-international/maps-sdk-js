import type { POICategory } from '@tomtom-org/maps-sdk/core';

/**
 * A single POI category entry returned by the POI categories service.
 *
 * @group POI Categories
 */
export type POICategoryResult = {
    /**
     * The standardized enum value identifying this category.
     *
     * Use this value in search `poiCategories` parameters to filter results by category,
     * or to cross-reference with `Place.properties.poi.categories` on search results.
     */
    code: POICategory;
    /**
     * Codes of sub-categories that also matched the current filter result set.
     *
     * Only contains codes present in the filtered result set — not the full list of
     * possible sub-categories — so you can understand the category hierarchy without
     * additional lookups.
     *
     * Use these values directly in search `poiCategories` parameters.
     */
    childCategoryCodes: POICategory[];
    /**
     * Human-readable category name in the requested language.
     */
    name: string;
    /**
     * Alternative names and synonyms for this category in the requested language.
     */
    synonyms: string[];
};

/**
 * Response from the POI categories service.
 *
 * @group POI Categories
 */
export type POICategoriesResponse = {
    poiCategories: POICategoryResult[];
};
