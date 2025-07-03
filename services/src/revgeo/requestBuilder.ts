import { getPositionStrict } from '@anw/maps-sdk-js/core';
import isNil from 'lodash/isNil';
import type { CommonServiceParams } from '../shared';
import { arrayToCSV } from '../shared/arrays';
import { PLACES_URL_PATH } from '../shared/commonSearchRequestBuilder';
import { appendCommonParams } from '../shared/requestBuildingUtils';
import type { ReverseGeocodingParams } from './types/reverseGeocodingParams';

const buildURLBasePath = (params: CommonServiceParams): string =>
    params.customServiceBaseURL || `${params.commonBaseURL}${PLACES_URL_PATH}/reverseGeocode`;

/**
 * Default function for building a reverse geocoding request from {@link ReverseGeocodingParams}
 * @param params The reverse geocoding parameters, with global configuration already merged into them.
 */
export const buildRevGeoRequest = (params: ReverseGeocodingParams): URL => {
    const lngLat = getPositionStrict(params.position);
    const url = new URL(`${buildURLBasePath(params)}/${lngLat[1]},${lngLat[0]}.json`);
    const urlParams = url.searchParams;
    appendCommonParams(urlParams, params);

    // rev-geo specific parameters:
    params.allowFreeformNewline && urlParams.append('allowFreeformNewline', String(params.allowFreeformNewline));
    params.geographyType && urlParams.append('entityType', arrayToCSV(params.geographyType));
    !isNil(params.heading) && urlParams.append('heading', String(params.heading));
    params.mapcodes && urlParams.append('mapcodes', arrayToCSV(params.mapcodes));
    params.number && urlParams.append('number', params.number);
    !isNil(params.radiusMeters) && urlParams.append('radius', String(params.radiusMeters));
    params.returnSpeedLimit && urlParams.append('returnSpeedLimit', String(params.returnSpeedLimit));
    params.returnRoadUse && urlParams.append('returnRoadUse', String(params.returnRoadUse));
    params.roadUses && urlParams.append('roadUse', JSON.stringify(params.roadUses));
    return url;
};
