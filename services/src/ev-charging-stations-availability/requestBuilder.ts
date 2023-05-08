import isNil from "lodash/isNil";

import { EVChargingStationsAvailabilityParams } from "./types/evChargingStationsAvailabilityParams";
import { appendCommonParams } from "../shared/requestBuildingUtils";
import { arrayToCSV } from "../shared/arrays";

const buildURLBasePath = (params: EVChargingStationsAvailabilityParams): string =>
    params.customServiceBaseURL || `${params.commonBaseURL}/search/3/chargingAvailability.json`;

/**
 * Default method for building ev charging stations availability request from {@link EVChargingStationsAvailabilityParams}
 * @param params The charging availability parameters, with global configuration already merged into them.
 */
export const buildEVChargingStationsAvailabilityRequest = (params: EVChargingStationsAvailabilityParams): URL => {
    const url = new URL(buildURLBasePath(params));
    const urlParams = url.searchParams;
    appendCommonParams(urlParams, params);
    // ev charging stations availability specific parameters:
    params.id && urlParams.append("id", params.id);
    params.connectorTypes && urlParams.append("connectorSet", arrayToCSV(params.connectorTypes));
    !isNil(params.minPowerKW) && urlParams.append("minPowerKW", String(params.minPowerKW));
    !isNil(params.maxPowerKW) && urlParams.append("maxPowerKW", String(params.maxPowerKW));
    return url;
};
