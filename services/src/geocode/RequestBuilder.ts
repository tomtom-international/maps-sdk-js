import { bboxFromGeoJSON, getLngLatArray } from "@anw/go-sdk-js/core";
import isNil from "lodash/isNil";

import { GeocodingParams } from "./types/GeocodingParams";
import { arrayToCSV } from "../shared/Arrays";
import { appendCommonParams } from "../shared/RequestBuildingUtils";

const buildURLBasePath = (params: GeocodingParams): string =>
    params.customServiceBaseURL || `${params.commonBaseURL}/search/2/geocode`;

/**
 * Default method for building geocoding request from {@link GeocodingParams}
 * @group Geocoding
 * @category Functions
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
    const lngLat = params.position && getLngLatArray(params.position);
    if (lngLat) {
        urlParams.append("lat", String(lngLat[1]));
        urlParams.append("lon", String(lngLat[0]));
    }
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
