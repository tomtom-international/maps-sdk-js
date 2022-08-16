import { getLngLatArray, mergeFromGlobal } from "@anw/go-sdk-js/core";
import { Position } from "geojson";

import { ReverseGeocodingParams } from "./ReverseGeocodingParams";
import { arrayToCSV } from "../shared/Arrays";

const buildURLBasePath = (lngLat: Position, mergedOptions: ReverseGeocodingParams): string =>
    mergedOptions.customBaseURL || `${mergedOptions.baseDomainURL}search/2/reverseGeocode/`;

/**
 * Default method for building reverse geocoding request from {@link ReverseGeocodingParams}
 * @group Search
 * @category Reverse Geocoding
 * @param params
 */
export const buildRevGeoRequest = (params: ReverseGeocodingParams): URL => {
    const mergedParams = <ReverseGeocodingParams>mergeFromGlobal(params);
    const lngLat = getLngLatArray(mergedParams.position);
    const url = new URL(`${buildURLBasePath(lngLat, mergedParams)}${lngLat[1]},${lngLat[0]}.json`);
    const urlParams = url.searchParams;
    // common parameters:
    urlParams.append("key", mergedParams.apiKey as string);
    mergedParams.language && urlParams.append("language", mergedParams.language);
    // rev-geo specific parameters:
    mergedParams.allowFreeformNewline &&
        urlParams.append("allowFreeformNewline", String(mergedParams.allowFreeformNewline));
    mergedParams.geographyType && urlParams.append("entityType", arrayToCSV(mergedParams.geographyType));
    mergedParams.heading && urlParams.append("heading", String(mergedParams.heading));
    mergedParams.mapcodes && urlParams.append("mapcodes", arrayToCSV(mergedParams.mapcodes));
    mergedParams.number && urlParams.append("number", mergedParams.number);
    mergedParams.radius && urlParams.append("radius", String(mergedParams.radius));
    mergedParams.returnSpeedLimit && urlParams.append("returnSpeedLimit", String(mergedParams.returnSpeedLimit));
    mergedParams.returnRoadUse && urlParams.append("returnRoadUse", String(mergedParams.returnRoadUse));
    mergedParams.roadUse && urlParams.append("roadUse", JSON.stringify(mergedParams.roadUse));
    return url;
};
