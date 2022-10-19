import isNil from "lodash/isNil";

import { ChargingAvailabilityParams } from "./types/ChargingAvailabilityParams";
import { appendCommonParams } from "../shared/RequestBuildingUtils";
import { arrayToCSV } from "../shared/Arrays";

const buildURLBasePath = (params: ChargingAvailabilityParams): string =>
    params.customServiceBaseURL || `${params.commonBaseURL}/search/3/chargingAvailability.json`;

/**
 * Default method for building charging availability request from {@link ChargingAvailabilityParams}
 * @group ChargingAvailability
 * @category Functions
 * @param params The charging availability parameters, with global configuration already merged into them.
 */
export const buildChargingAvailabilityRequest = (params: ChargingAvailabilityParams): URL => {
    const url = new URL(buildURLBasePath(params));
    const urlParams = url.searchParams;
    appendCommonParams(urlParams, params);
    // charging availability specific parameters:
    params.id && urlParams.append("id", params.id);
    params.connectorTypes && urlParams.append("connectorSet", arrayToCSV(params.connectorTypes));
    !isNil(params.minPowerKW) && urlParams.append("minPowerKW", String(params.minPowerKW));
    !isNil(params.maxPowerKW) && urlParams.append("maxPowerKW", String(params.maxPowerKW));
    return url;
};
