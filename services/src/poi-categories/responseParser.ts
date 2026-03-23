import { type POICategory, poiIDsToCategories } from '@tomtom-org/maps-sdk/core';
import type { POICategoriesResponse, POICategoryResult, PoiCategoriesResponseAPI } from './types';

const parsePoiCategory = (api: PoiCategoriesResponseAPI['poiCategories'][number]): POICategoryResult | null => {
    const code = poiIDsToCategories[api.id];
    if (!code) {
        console.error(
            `Received unknown POI category ID ${api.id} (${api.name}). This category will be skipped and unavailable for filtering.`,
        );
        return null;
    }
    return {
        code,
        name: api.name,
        childCategoryCodes: api.childCategoryIds
            .map((id) => poiIDsToCategories[id])
            .filter((c): c is POICategory => !!c),
        synonyms: api.synonyms,
    };
};

/**
 * @ignore
 */
export const parsePoiCategoriesResponse = (apiResponse: PoiCategoriesResponseAPI): POICategoriesResponse => ({
    poiCategories: apiResponse.poiCategories.map(parsePoiCategory).filter((c) => c !== null),
});
