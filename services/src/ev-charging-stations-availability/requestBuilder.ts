import { PLACES_URL_PATH } from '../shared/request/commonSearchRequestBuilder';
import { appendCommonParams } from '../shared/request/requestBuildingUtils';
import type { ChargingStationsAvailabilityParams } from './types/evChargingStationsAvailabilityParams';

const buildUrlBasePath = (params: ChargingStationsAvailabilityParams): string =>
    params.customServiceBaseURL ?? `${params.commonBaseURL}${PLACES_URL_PATH}/ev/id`;

/**
 * Default method for building ev charging stations availability request from {@link ChargingStationsAvailabilityParams}
 * @param params The charging availability parameters, with global configuration already merged into them.
 */
export const buildEVChargingStationsAvailabilityRequest = (params: ChargingStationsAvailabilityParams): URL => {
    const url = new URL(buildUrlBasePath(params));
    const urlParams = url.searchParams;
    appendCommonParams(urlParams, params);
    urlParams.append('id', params.id);
    return url;
};
