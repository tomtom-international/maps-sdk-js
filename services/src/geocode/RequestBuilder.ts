import { getLngLatArray, mergeFromGlobal } from "@anw/go-sdk-js/core";
import isNil from "lodash/isNil";

import { GeocodingParams } from "./types/GeocodingParams";
import { arrayToCSV } from "../shared/Arrays";
import { polygonToTopLeftBBox, polygonToBtmRightBBox } from "../shared/Geometry";

const buildURLBasePath = (mergedOptions: GeocodingParams): string =>
    mergedOptions.customBaseURL || `${mergedOptions.baseDomainURL}search/2/geocode/`;

export const buildGeocodingRequest = (params: GeocodingParams): URL => {
    const mergedParams = mergeFromGlobal(params);
    const lngLat = mergedParams.position && getLngLatArray(mergedParams.position);
    const url = new URL(`${buildURLBasePath(mergedParams)}${mergedParams.query}.json`);
    const urlParams = url.searchParams;
    // common parameters:
    mergedParams.apiKey && urlParams.append("key", mergedParams.apiKey);
    mergedParams.language && urlParams.append("language", mergedParams.language);
    // geocoding specific parameters:
    mergedParams.typeahead && urlParams.append("typeahead", String(mergedParams.typeahead));
    !isNil(mergedParams.limit) && urlParams.append("limit", String(mergedParams.limit));
    !isNil(mergedParams.offset) && urlParams.append("ofs", String(mergedParams.offset));
    if (lngLat) {
        urlParams.append("lat", String(lngLat[1]));
        urlParams.append("lon", String(lngLat[0]));
    }
    mergedParams.countrySet && urlParams.append("countrySet", arrayToCSV(mergedParams.countrySet));
    !isNil(mergedParams.radius) && urlParams.append("radius", String(mergedParams.radius));
    if (mergedParams.boundingBox) {
        const topLeft = polygonToTopLeftBBox(mergedParams.boundingBox);
        const btmRight = polygonToBtmRightBBox(mergedParams.boundingBox);
        urlParams.append("topLeft", arrayToCSV(topLeft));
        urlParams.append("btmRight", arrayToCSV(btmRight));
    }
    mergedParams.extendedPostalCodesFor &&
        urlParams.append("extendedPostalCodesFor", arrayToCSV(mergedParams.extendedPostalCodesFor));
    mergedParams.mapcodes && urlParams.append("mapcodes", arrayToCSV(mergedParams.mapcodes));
    mergedParams.view && urlParams.append("view", mergedParams.view);
    mergedParams.geographyType && urlParams.append("entityTypeSet", arrayToCSV(mergedParams.geographyType));
    return url;
};
