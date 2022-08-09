import { mergeFromGlobal } from "@anw/go-sdk-js/core";

import { GeocodingParams } from "./types";
import { arrayToCSV } from "../..";

const buildURLBasePath = (mergedOptions: GeocodingParams): string =>
    mergedOptions.customBaseURL || `${mergedOptions.baseDomainURL}search/2/geocode/`;

export const buildGeocodingRequest = (params: GeocodingParams): URL => {
    const mergedParams = mergeFromGlobal(params);
    const url = new URL(`${buildURLBasePath(mergedParams)}${mergedParams.query}.json`);
    const urlParams = url.searchParams;
    // common parameters:
    urlParams.append("key", mergedParams.apiKey as string);
    mergedParams.language && urlParams.append("language", mergedParams.language);
    // geocoding specific parameters:
    mergedParams.typeahead && urlParams.append("typeahead", String(mergedParams.typeahead));
    mergedParams.limit && urlParams.append("limit", String(mergedParams.limit));
    mergedParams.ofs && urlParams.append("ofs", String(mergedParams.ofs));
    mergedParams.lat && urlParams.append("lat", String(mergedParams.lat));
    mergedParams.lon && urlParams.append("lon", String(mergedParams.lon));
    mergedParams.countrySet && urlParams.append("countrySet", arrayToCSV(mergedParams.countrySet));
    mergedParams.radius && urlParams.append("radius", String(mergedParams.radius));
    mergedParams.topLeft && urlParams.append("topLeft", String(mergedParams.topLeft));
    mergedParams.btmRight && urlParams.append("btmRight", String(mergedParams.btmRight));
    mergedParams.extendedPostalCodesFor &&
        urlParams.append("extendedPostalCodesFor", arrayToCSV(mergedParams.extendedPostalCodesFor));
    mergedParams.mapcodes && urlParams.append("mapcodes", arrayToCSV(mergedParams.mapcodes));
    mergedParams.view && urlParams.append("view", arrayToCSV(mergedParams.view));
    mergedParams.entityTypeSet && urlParams.append("entityTypeSet", arrayToCSV(mergedParams.entityTypeSet));
    return url;
};
