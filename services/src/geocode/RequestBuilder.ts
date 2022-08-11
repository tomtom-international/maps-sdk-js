import { getLngLatArray, mergeFromGlobal } from "@anw/go-sdk-js/core";

import { GeocodingParams } from "./types";
import { arrayToCSV } from "../shared/Arrays";
import { polygonToTopLeftBBox, polygonToBtmRightBBox } from "../shared/Geometry";

const buildURLBasePath = (mergedOptions: GeocodingParams): string =>
    mergedOptions.customBaseURL || `${mergedOptions.baseDomainURL}search/2/geocode/`;

export const buildGeocodingRequest = (params: GeocodingParams): URL => {
    const mergedParams = mergeFromGlobal(params);
    const lngLat = mergedParams.position && getLngLatArray(mergedParams.position);
    let topLeft, btmRight;
    if (mergedParams.boundingBox) {
        topLeft = polygonToTopLeftBBox(mergedParams.boundingBox);
        btmRight = polygonToBtmRightBBox(mergedParams.boundingBox);
    }
    const url = new URL(`${buildURLBasePath(mergedParams)}${mergedParams.query}.json`);
    const urlParams = url.searchParams;
    // common parameters:
    urlParams.append("key", mergedParams.apiKey as string);
    mergedParams.language && urlParams.append("language", mergedParams.language);
    // geocoding specific parameters:
    mergedParams.typeahead && urlParams.append("typeahead", String(mergedParams.typeahead));
    mergedParams.limit && urlParams.append("limit", String(mergedParams.limit));
    mergedParams.offset && urlParams.append("ofs", String(mergedParams.offset));
    if (lngLat) {
        urlParams.append("lat", String(lngLat[1]));
        urlParams.append("lon", String(lngLat[0]));
    }
    mergedParams.countrySet && urlParams.append("countrySet", arrayToCSV(mergedParams.countrySet));
    mergedParams.radius && urlParams.append("radius", String(mergedParams.radius));
    if (topLeft && btmRight) {
        urlParams.append("topLeft", arrayToCSV(topLeft));
        urlParams.append("btmRight", arrayToCSV(btmRight));
    }
    mergedParams.extendedPostalCodesFor &&
        urlParams.append("extendedPostalCodesFor", arrayToCSV(mergedParams.extendedPostalCodesFor));
    mergedParams.mapcodes && urlParams.append("mapcodes", arrayToCSV(mergedParams.mapcodes));
    mergedParams.view && urlParams.append("view", arrayToCSV(mergedParams.view));
    mergedParams.entityTypeSet && urlParams.append("entityTypeSet", arrayToCSV(mergedParams.entityTypeSet));
    return url;
};
