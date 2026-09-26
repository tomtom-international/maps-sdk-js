import { isNil } from 'lodash-es';
import type { GetObject } from '../shared';
import { arrayToCSV } from '../shared/arrays';
import { resolvePlacesEndpointUrl } from '../shared/request/placesEndpoint';
import {
    appendGeoBiasParams,
    appendPlacesLanguageParam,
    buildPlacesRequestHeaders,
} from '../shared/request/requestBuildingUtils';
import type { GeocodingParams } from './types/geocodingParams';

const buildUrlBasePath = (params: GeocodingParams): string => resolvePlacesEndpointUrl(params, 'geocode');

/**
 * Default method for building geocoding request from {@link GeocodingParams}
 * @param params The geocoding parameters, with global configuration already merged into them.
 */
export const buildGeocodingRequest = (params: GeocodingParams): GetObject => {
    const url = new URL(`${buildUrlBasePath(params)}/${params.query}.json`);
    const urlParams = url.searchParams;
    appendPlacesLanguageParam(urlParams, params);
    // geocoding specific parameters:
    params.typeahead && urlParams.append('typeahead', String(params.typeahead));
    !isNil(params.limit) && urlParams.append('limit', String(params.limit));
    !isNil(params.offset) && urlParams.append('ofs', String(params.offset));
    appendGeoBiasParams(urlParams, params.geoBias);
    params.countries && urlParams.append('countrySet', arrayToCSV(params.countries));
    params.extendedPostalCodesFor &&
        urlParams.append('extendedPostalCodesFor', arrayToCSV(params.extendedPostalCodesFor));
    params.mapcodes && urlParams.append('mapcodes', arrayToCSV(params.mapcodes));
    params.view && urlParams.append('view', params.view);
    params.geographyTypes && urlParams.append('entityTypeSet', arrayToCSV(params.geographyTypes));
    return { url, headers: buildPlacesRequestHeaders(params) };
};
