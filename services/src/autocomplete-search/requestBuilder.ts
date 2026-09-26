import type { GetObject } from '../shared';
import { resolvePlacesEndpointUrl } from '../shared/request/placesEndpoint';
import {
    appendByJoiningParamValue,
    appendGeoBiasParams,
    appendOptionalParam,
    appendPlacesLanguageParam,
    buildPlacesRequestHeaders,
} from '../shared/request/requestBuildingUtils';
import type { AutocompleteSearchParams } from './types';

const buildUrlBasePath = (mergedOptions: AutocompleteSearchParams): string =>
    resolvePlacesEndpointUrl(mergedOptions, `autocomplete/${mergedOptions.query}.json`);

/**
 * Default function for building autocomplete request from {@link AutocompleteSearchParams}
 * @param params The autocomplete parameters, with global configuration already merged into them.
 */
export const buildAutocompleteSearchRequest = (params: AutocompleteSearchParams): GetObject => {
    const url = new URL(`${buildUrlBasePath(params)}`);
    const urlParams = url.searchParams;
    /**
     * Auto-complete service defaults the language to en-GB if not specified explicitly as service param
     * Or global config
     */
    params.language = params.language ?? 'en-GB';
    appendPlacesLanguageParam(urlParams, params);
    appendOptionalParam(urlParams, 'limit', params.limit);
    appendGeoBiasParams(urlParams, params.geoBias);
    appendByJoiningParamValue(urlParams, 'countrySet', params.countries);
    appendByJoiningParamValue(urlParams, 'resultSet', params.resultType);

    return { url, headers: buildPlacesRequestHeaders(params) };
};
