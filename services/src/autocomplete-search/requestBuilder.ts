import type { AutocompleteSearchParams } from "./types";
import {
    appendByJoiningParamValue,
    appendCommonParams,
    appendLatLonParamsFromPosition,
    appendOptionalParam
} from "../shared/requestBuildingUtils";

const buildURLBasePath = (mergedOptions: AutocompleteSearchParams): string =>
    mergedOptions.customServiceBaseURL ||
    `${mergedOptions.commonBaseURL}/search/2/autocomplete/${mergedOptions.query}.json`;

/**
 * Default function for building autocomplete request from {@link AutocompleteSearchParams}
 * @param params The autocomplete parameters, with global configuration already merged into them.
 */
export const buildAutocompleteSearchRequest = (params: AutocompleteSearchParams): URL => {
    const url = new URL(`${buildURLBasePath(params)}`);
    const urlParams = url.searchParams;
    /**
     * Auto-complete service defaults the language to en-GB if not specified explicitly as service param
     * Or global config
     */
    params.language = params.language || "en-GB";
    appendCommonParams(urlParams, params);
    appendOptionalParam(urlParams, "limit", params.limit);
    appendLatLonParamsFromPosition(urlParams, params.position);
    appendByJoiningParamValue(urlParams, "countrySet", params.countries);
    appendOptionalParam(urlParams, "radius", params.radiusMeters);
    appendByJoiningParamValue(urlParams, "resultSet", params.resultType);

    return url;
};
