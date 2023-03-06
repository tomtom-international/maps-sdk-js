import { PlaceByIdParams } from "./types";
import { CommonServiceParams } from "../shared/ServiceTypes";
import { appendByJoiningParamValue, appendCommonParams, appendOptionalParam } from "../shared/RequestBuildingUtils";

const buildURLBasePath = (params: CommonServiceParams): string =>
    params.customServiceBaseURL || `${params.commonBaseURL}/search/2/place.json`;

/**
 * Default method for building place by id request from {@link PlaceByIdParams}
 * @param params The place by id parameters, with global configuration already merged into them.
 */
export const buildPlaceByIdRequest = (params: PlaceByIdParams): URL => {
    const url = new URL(`${buildURLBasePath(params)}`);
    const urlParams = url.searchParams;
    appendCommonParams(urlParams, params);
    appendOptionalParam(urlParams, "entityId", params.entityId);
    appendByJoiningParamValue(urlParams, "mapcodes", params.mapcodes);
    appendOptionalParam(urlParams, "view", params.view);
    appendOptionalParam(urlParams, "openingHours", params.openingHours);
    appendOptionalParam(urlParams, "timeZone", params.timeZone);
    appendOptionalParam(urlParams, "relatedPois", params.relatedPois);
    return url;
};
