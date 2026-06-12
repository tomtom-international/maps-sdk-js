import type { HasLngLat, POICategory, TomTomAPIHeaders } from '@tomtom-org/maps-sdk/core';
import { getPosition, poiCategoriesToID } from '@tomtom-org/maps-sdk/core';
import { isNil } from 'lodash-es';
import type { CommonServiceParams } from '../serviceTypes';

/**
 * Builds the TomTom API request headers common to every service: the API key,
 * API version, and language. Service request builders spread the result and add
 * any service-specific headers (e.g. `Attributes`) on top.
 * @ignore
 */
export const buildCommonServiceRequestHeaders = (params: CommonServiceParams): TomTomAPIHeaders => ({
    ...(params.apiKey && { 'TomTom-Api-Key': params.apiKey }),
    ...(!isNil(params.apiVersion) && { 'TomTom-Api-Version': String(params.apiVersion) }),
    ...(params.language && { 'Accept-Language': params.language }),
});

/**
 * @ignore
 * @param urlParams
 * @param params
 */
export const appendCommonParams = (urlParams: URLSearchParams, params: CommonServiceParams): void => {
    urlParams.append('apiVersion', String(params.apiVersion));
    if (params.apiKey) {
        urlParams.append('key', params.apiKey);
    }
    params.language && urlParams.append('language', params.language);
};

/**
 * Adds parameter from the array by repeating each array part into a query parameter of the same name.
 * E.g. ...&avoid=motorways&avoid=ferries&...
 * @ignore
 * @param urlParams
 * @param paramName
 * @param paramArray
 */
export const appendByRepeatingParamName = (
    urlParams: URLSearchParams,
    paramName: string,
    paramArray?: string[],
): void => {
    for (const param of paramArray || []) {
        urlParams.append(paramName, param);
    }
};

/**
 * @ignore
 */
export const appendByJoiningParamValue = (
    urlParams: URLSearchParams,
    name: string,
    values?: string[] | number[] | (string | number)[],
): void => {
    if (Array.isArray(values) && values.length > 0) {
        urlParams.append(name, values.join(','));
    }
};

/**
 * @ignore
 */
export const appendOptionalParam = (
    urlParams: URLSearchParams,
    name: string,
    value?: string | number | boolean,
): void => {
    !isNil(value) && urlParams.append(name, String(value));
};

/**
 * Adds lat and lon parameters to the url.
 * @ignore
 * @param urlParams
 * @param hasLngLat
 */
export const appendLatLonParamsFromPosition = (urlParams: URLSearchParams, hasLngLat: HasLngLat | undefined): void => {
    const position = getPosition(hasLngLat);
    if (position) {
        urlParams.append('lat', String(position[1]));
        urlParams.append('lon', String(position[0]));
    }
};

/**
 * Map POICategory values to their numeric IDs for use in API requests.
 * @ignore
 */
export const mapPOICategoriesToIDs = (categories: POICategory[]): number[] =>
    categories.map((category) => poiCategoriesToID[category]);
