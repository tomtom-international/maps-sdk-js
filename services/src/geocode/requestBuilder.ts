import { bboxFromGeoJSON } from "@anw/maps-sdk-js/core";
import isNil from "lodash/isNil";

import { GeocodingParams } from "./types/geocodingParams";
import { arrayToCSV } from "../shared/arrays";
import { appendCommonParams, appendLatLonParamsFromPosition } from "../shared/requestBuildingUtils";

const buildURLBasePath = (params: GeocodingParams): string =>
    params.customServiceBaseURL || `${params.commonBaseURL}/search/2/geocode`;

/**
 * Default method for building geocoding request from {@link GeocodingParams}
 * @param params The geocoding parameters, with global configuration already merged into them.
 */
export const buildGeocodingRequest = (params: GeocodingParams): URL => {
    const url = new URL(`${buildURLBasePath(params)}/${params.query}.json`);
    const urlParams = url.searchParams;
    appendCommonParams(urlParams, params);
    // geocoding specific parameters:
    params.typeahead && urlParams.append("typeahead", String(params.typeahead));
    !isNil(params.limit) && urlParams.append("limit", String(params.limit));
    !isNil(params.offset) && urlParams.append("ofs", String(params.offset));
    appendLatLonParamsFromPosition(urlParams, params.position);
    params.countries && urlParams.append("countrySet", arrayToCSV(params.countries));
    !isNil(params.radiusMeters) && urlParams.append("radius", String(params.radiusMeters));
    const bbox = params.boundingBox && bboxFromGeoJSON(params.boundingBox);
    if (bbox) {
        urlParams.append("topLeft", arrayToCSV([bbox[3], bbox[0]]));
        urlParams.append("btmRight", arrayToCSV([bbox[1], bbox[2]]));
    }
    params.extendedPostalCodesFor &&
        urlParams.append("extendedPostalCodesFor", arrayToCSV(params.extendedPostalCodesFor));
    params.mapcodes && urlParams.append("mapcodes", arrayToCSV(params.mapcodes));
    params.view && urlParams.append("view", params.view);
    params.geographyTypes && urlParams.append("entityTypeSet", arrayToCSV(params.geographyTypes));
    return url;
};
