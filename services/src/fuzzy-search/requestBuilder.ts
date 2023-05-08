import { bboxFromGeoJSON } from "@anw/maps-sdk-js/core";
import { FuzzySearchParams } from "./types";
import { appendByJoiningParamValue, appendOptionalParam } from "../shared/requestBuildingUtils";
import { appendCommonSearchParams } from "../shared/commonSearchRequestBuilder";
import { arrayToCSV } from "../shared/arrays";

const buildURLBasePath = (mergedOptions: FuzzySearchParams): string =>
    mergedOptions.customServiceBaseURL || `${mergedOptions.commonBaseURL}/search/2/search/${mergedOptions.query}.json`;

/**
 * Default function for building a fuzzy search request from {@link FuzzySearchParams}
 * @param params The fuzzy search parameters, with global configuration already merged into them.
 */
export const buildFuzzySearchRequest = (params: FuzzySearchParams): URL => {
    const url = new URL(`${buildURLBasePath(params)}`);
    appendCommonSearchParams(url, params);
    const urlParams = url.searchParams;
    appendOptionalParam(urlParams, "typeahead", params.typeahead);
    appendOptionalParam(urlParams, "ofs", params.offset);
    appendByJoiningParamValue(urlParams, "countrySet", params.countries);
    appendOptionalParam(urlParams, "radius", params.radiusMeters);
    const bbox = params.boundingBox && bboxFromGeoJSON(params.boundingBox);
    if (bbox) {
        urlParams.append("topLeft", arrayToCSV([bbox[3], bbox[0]]));
        urlParams.append("btmRight", arrayToCSV([bbox[1], bbox[2]]));
    }
    appendOptionalParam(urlParams, "minFuzzyLevel", params.minFuzzyLevel);
    appendOptionalParam(urlParams, "maxFuzzyLevel", params.maxFuzzyLevel);
    return url;
};
