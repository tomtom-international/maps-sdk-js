import type { GetObject } from '../shared';
import { resolvePlacesEndpointUrl } from '../shared/request/placesEndpoint';
import { appendPlacesLanguageParam, buildPlacesRequestHeaders } from '../shared/request/requestBuildingUtils';
import type { POICategoriesParams } from './types';

/**
 * Builds the POI categories request URL from the merged params.
 * The `filters` param is intentionally omitted — it is applied client-side.
 * @ignore
 */
export const buildPoiCategoriesRequest = (params: POICategoriesParams): GetObject => {
    const baseUrl = resolvePlacesEndpointUrl(params, 'poiCategories.json');
    const url = new URL(baseUrl);
    appendPlacesLanguageParam(url.searchParams, params);
    return { url, headers: buildPlacesRequestHeaders(params) };
};
