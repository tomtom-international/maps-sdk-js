import { getLngLatArray } from "@anw/go-sdk-js/core";
import isNil from "lodash/isNil";

import { GeocodingParams } from "./types/GeocodingParams";
import { arrayToCSV } from "../shared/Arrays";
import { polygonToTopLeftBBox, polygonToBtmRightBBox } from "../shared/Geometry";
import { appendCommonParams } from "../shared/RequestBuildingUtils";

const buildURLBasePath = (mergedOptions: GeocodingParams): string =>
    mergedOptions.customServiceBaseURL || `${mergedOptions.commonBaseURL}/search/2/geocode`;

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
    params.countrySet && urlParams.append("countrySet", arrayToCSV(params.countrySet));
    !isNil(params.radius) && urlParams.append("radius", String(params.radius));
    if (params.boundingBox) {
        const topLeft = polygonToTopLeftBBox(params.boundingBox);
        const btmRight = polygonToBtmRightBBox(params.boundingBox);
        urlParams.append("topLeft", arrayToCSV(topLeft));
        urlParams.append("btmRight", arrayToCSV(btmRight));
    }
    params.extendedPostalCodesFor &&
        urlParams.append("extendedPostalCodesFor", arrayToCSV(params.extendedPostalCodesFor));
    params.mapcodes && urlParams.append("mapcodes", arrayToCSV(params.mapcodes));
    params.view && urlParams.append("view", params.view);
    params.geographyTypes && urlParams.append("entityTypeSet", arrayToCSV(params.geographyTypes));
    return url;
};
