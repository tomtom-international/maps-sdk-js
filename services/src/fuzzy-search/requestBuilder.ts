import type { GetObject } from '../shared';
import { appendCommonSearchParams } from '../shared/request/commonSearchRequestBuilder';
import { resolvePlacesEndpointUrl } from '../shared/request/placesEndpoint';
import {
    appendByJoiningParamValue,
    appendGeoBiasParams,
    appendOptionalParam,
    buildPlacesRequestHeaders,
} from '../shared/request/requestBuildingUtils';
import type { FuzzySearchParams } from './types';

const buildUrlBasePath = (params: FuzzySearchParams): string =>
    resolvePlacesEndpointUrl(params, `search/${params.query ?? ''}.json`);

/**
 * Default function for building a fuzzy search request from {@link FuzzySearchParams}
 * @param params The fuzzy search parameters, with global configuration already merged into them.
 */
export const buildFuzzySearchRequest = (params: FuzzySearchParams): GetObject => {
    const url = new URL(`${buildUrlBasePath(params)}`);
    appendCommonSearchParams(url, params);
    const urlParams = url.searchParams;
    appendOptionalParam(urlParams, 'typeahead', params.typeahead);
    appendOptionalParam(urlParams, 'ofs', params.offset);
    appendByJoiningParamValue(urlParams, 'countrySet', params.countries);
    appendGeoBiasParams(urlParams, params.geoBias);
    appendOptionalParam(urlParams, 'minFuzzyLevel', params.minFuzzyLevel);
    appendOptionalParam(urlParams, 'maxFuzzyLevel', params.maxFuzzyLevel);
    return { url, headers: buildPlacesRequestHeaders(params) };
};
