import { resolvePlacesEndpointUrl } from '../shared/request/placesEndpoint';
import { appendCommonParams } from '../shared/request/requestBuildingUtils';
import type { ChargingStationsAvailabilityParams } from './types/evChargingStationsAvailabilityParams';

const buildUrlBasePath = (params: ChargingStationsAvailabilityParams): string =>
    resolvePlacesEndpointUrl(params, 'ev/id');

/**
 * Default method for building ev charging stations availability request from {@link ChargingStationsAvailabilityParams}
 * @param params The charging availability parameters, with global configuration already merged into them.
 *
 * @remarks
 * Unlike the other places services, this one keeps `key=` and `apiVersion=` in the query string.
 * `/maps/orbis/places/ev/id` answers 401 to a header-only credential, while `search`,
 * `poiCategories`, `geocode`, `place` and `additionalData` all accept one — probed against
 * production. Moving this one to headers breaks it outright rather than subtly, so it stays until
 * the endpoint catches up.
 */
export const buildEVChargingStationsAvailabilityRequest = (params: ChargingStationsAvailabilityParams): URL => {
    const url = new URL(buildUrlBasePath(params));
    const urlParams = url.searchParams;
    appendCommonParams(urlParams, params);
    urlParams.append('id', params.id);
    return url;
};
