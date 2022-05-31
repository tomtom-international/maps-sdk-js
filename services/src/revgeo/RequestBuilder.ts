import { mergeFromGlobal } from "core";
import { Position } from "geojson";

import { ReverseGeocodingOptions } from "./ReverseGeocodingOptions";
import { arrayToCSV } from "../shared/Arrays";

const buildURLBasePath = (lngLat: Position, mergedOptions: ReverseGeocodingOptions): string =>
    mergedOptions.customBaseURL || `${mergedOptions.baseDomainURL}search/2/reverseGeocode/`;

export const buildRevGeoRequest = (lngLat: Position, options?: ReverseGeocodingOptions): URL => {
    const mergedOptions = <ReverseGeocodingOptions>mergeFromGlobal(options);
    const url = new URL(`${buildURLBasePath(lngLat, mergedOptions)}${lngLat[1]},${lngLat[0]}.json`);
    const urlParams = url.searchParams;
    // common parameters:
    urlParams.append("key", mergedOptions.apiKey as string);
    mergedOptions.language && urlParams.append("language", mergedOptions.language);
    // rev-geo specific parameters:
    mergedOptions.allowFreeformNewline &&
        urlParams.append("allowFreeformNewline", String(mergedOptions.allowFreeformNewline));
    mergedOptions.entityType && urlParams.append("entityType", mergedOptions.entityType as string);
    mergedOptions.heading && urlParams.append("heading", String(mergedOptions.heading));
    mergedOptions.mapcodes && urlParams.append("mapcodes", arrayToCSV(mergedOptions.mapcodes));
    mergedOptions.number && urlParams.append("number", mergedOptions.number);
    mergedOptions.radius && urlParams.append("radius", String(mergedOptions.radius));
    mergedOptions.returnSpeedLimit && urlParams.append("returnSpeedLimit", String(mergedOptions.returnSpeedLimit));
    mergedOptions.returnRoadUse && urlParams.append("returnRoadUse", String(mergedOptions.returnRoadUse));
    mergedOptions.roadUse && urlParams.append("roadUse", JSON.stringify(mergedOptions.roadUse));
    return url;
};
