import type { CommonServiceParams, GetObject } from '../shared';
import { resolvePlacesEndpointUrl } from '../shared/request/placesEndpoint';
import {
    appendByJoiningParamValue,
    appendOptionalParam,
    appendPlacesLanguageParam,
    buildPlacesRequestHeaders,
} from '../shared/request/requestBuildingUtils';
import type { PlaceByIdParams } from './types';

const buildUrlBasePath = (params: CommonServiceParams): string => resolvePlacesEndpointUrl(params, 'place.json');

/**
 * Default method for building place by id request from {@link PlaceByIdParams}
 * @param params The place by id parameters, with global configuration already merged into them.
 */
export const buildPlaceByIdRequest = (params: PlaceByIdParams): GetObject => {
    const url = new URL(`${buildUrlBasePath(params)}`);
    const urlParams = url.searchParams;
    appendPlacesLanguageParam(urlParams, params);
    appendOptionalParam(urlParams, 'entityId', params.entityId);
    appendByJoiningParamValue(urlParams, 'mapcodes', params.mapcodes);
    appendOptionalParam(urlParams, 'view', params.view);
    appendOptionalParam(urlParams, 'openingHours', params.openingHours);
    appendOptionalParam(urlParams, 'timeZone', params.timeZone);
    appendOptionalParam(urlParams, 'relatedPois', params.relatedPois);
    return { url, headers: buildPlacesRequestHeaders(params) };
};
