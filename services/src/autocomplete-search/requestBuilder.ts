import { PLACES_URL_PATH } from '../shared/request/commonSearchRequestBuilder';
import {
    appendByJoiningParamValue,
    appendCommonParams,
    appendGeoBiasParams,
    appendOptionalParam,
} from '../shared/request/requestBuildingUtils';
import type { AutocompleteSearchParams } from './types';

const buildUrlBasePath = (mergedOptions: AutocompleteSearchParams): string =>
    mergedOptions.customServiceBaseURL ||
    `${mergedOptions.commonBaseURL}${PLACES_URL_PATH}/autocomplete/${mergedOptions.query}.json`;

/**
 * Default function for building autocomplete request from {@link AutocompleteSearchParams}
 * @param params The autocomplete parameters, with global configuration already merged into them.
 */
export const buildAutocompleteSearchRequest = (params: AutocompleteSearchParams): URL => {
    const url = new URL(`${buildUrlBasePath(params)}`);
    const urlParams = url.searchParams;
    /**
     * Auto-complete service defaults the language to en-GB if not specified explicitly as service param
     * Or global config
     */
    params.language = params.language ?? 'en-GB';
    appendCommonParams(urlParams, params);
    appendOptionalParam(urlParams, 'limit', params.limit);
    appendGeoBiasParams(urlParams, params.geoBias);
    appendByJoiningParamValue(urlParams, 'countrySet', params.countries);
    appendByJoiningParamValue(urlParams, 'resultSet', params.resultType);

    return url;
};
