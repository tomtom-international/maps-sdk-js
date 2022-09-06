import isNil from "lodash/isNil";

import { getLngLatArray } from "@anw/go-sdk-js/core";
import { ReverseGeocodingParams } from "./types/ReverseGeocodingParams";
import { arrayToCSV } from "../shared/Arrays";
import { CommonServiceParams } from "../shared/ServiceTypes";
import { appendCommonParams } from "../shared/RequestBuildingUtils";

const buildURLBasePath = (params: CommonServiceParams): string =>
    params.customServiceBaseURL || `${params.commonBaseURL}/search/2/reverseGeocode`;

/**
 * Default method for building reverse geocoding request from {@link ReverseGeocodingParams}
 * @group Reverse Geocoding
 * @category Functions
 * @param params The reverse geocoding parameters, with global configuration already merged into them.
 */
export const buildRevGeoRequest = (params: ReverseGeocodingParams): URL => {
    const lngLat = getLngLatArray(params.position);
    const url = new URL(`${buildURLBasePath(params)}/${lngLat[1]},${lngLat[0]}.json`);
    const urlParams = url.searchParams;
    appendCommonParams(urlParams, params);
    // rev-geo specific parameters:
    params.allowFreeformNewline && urlParams.append("allowFreeformNewline", String(params.allowFreeformNewline));
    params.geographyType && urlParams.append("entityType", arrayToCSV(params.geographyType));
    !isNil(params.heading) && urlParams.append("heading", String(params.heading));
    params.mapcodes && urlParams.append("mapcodes", arrayToCSV(params.mapcodes));
    params.number && urlParams.append("number", params.number);
    !isNil(params.radius) && urlParams.append("radius", String(params.radius));
    params.returnSpeedLimit && urlParams.append("returnSpeedLimit", String(params.returnSpeedLimit));
    params.returnRoadUse && urlParams.append("returnRoadUse", String(params.returnRoadUse));
    params.roadUses && urlParams.append("roadUse", JSON.stringify(params.roadUses));
    return url;
};
