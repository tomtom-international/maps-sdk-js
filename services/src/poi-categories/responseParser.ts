import type { POICategory } from '@tomtom-org/maps-sdk/core';
import { poiIDsToCategories } from '@tomtom-org/maps-sdk/core';
import type { POICategoriesResponse, POICategoryResult, PoiCategoriesResponseAPI } from './types';

const parsePoiCategory = (api: PoiCategoriesResponseAPI['poiCategories'][number]): POICategoryResult => ({
    code: poiIDsToCategories[api.id],
    name: api.name,
    childCategoryCodes: api.childCategoryIds.map((id) => poiIDsToCategories[id]).filter((c): c is POICategory => !!c),
    synonyms: api.synonyms,
});

/**
 * @ignore
 */
export const parsePoiCategoriesResponse = (apiResponse: PoiCategoriesResponseAPI): POICategoriesResponse => ({
    poiCategories: apiResponse.poiCategories.map(parsePoiCategory),
});
