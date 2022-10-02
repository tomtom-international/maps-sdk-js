import { PlaceByIdParams } from "./types";
import { CommonServiceParams } from "../shared/ServiceTypes";
import { appendByJoiningParamValue, appendCommonParams, appendParameter } from "../shared/RequestBuildingUtils";

const buildURLBasePath = (params: CommonServiceParams): string =>
    params.customServiceBaseURL || `${params.commonBaseURL}/search/2/place.json`;

/**
 * Default method for building place by id request from {@link PlaceByIdParams}
 * @group Place By Id
 * @category Functions
 * @param params The place by id parameters, with global configuration already merged into them.
 */
export const buildPlaceByIdRequest = (params: PlaceByIdParams): URL => {
    const url = new URL(`${buildURLBasePath(params)}`);
    const urlParams = url.searchParams;
    appendCommonParams(urlParams, params);
    appendParameter(urlParams, "entityId", params.entityId);
    appendByJoiningParamValue(urlParams, "mapcodes", params.mapcodes);
    appendParameter(urlParams, "view", params.view);
    appendParameter(urlParams, "openingHours", params.openingHours);
    appendParameter(urlParams, "timeZone", params.timeZone);
    appendParameter(urlParams, "relatedPois", params.relatedPois);
    return url;
};
