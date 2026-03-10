import { PLACES_URL_PATH } from '../shared/request/commonSearchRequestBuilder';
import { appendCommonParams } from '../shared/request/requestBuildingUtils';
import type { POICategoriesParams } from './types';

/**
 * Builds the POI categories request URL from the merged params.
 * The `filters` param is intentionally omitted — it is applied client-side.
 * @ignore
 */
export const buildPoiCategoriesRequest = (params: POICategoriesParams): URL => {
    const baseUrl = params.customServiceBaseURL ?? `${params.commonBaseURL}${PLACES_URL_PATH}/poiCategories.json`;
    const url = new URL(baseUrl);
    appendCommonParams(url.searchParams, params);
    return url;
};
