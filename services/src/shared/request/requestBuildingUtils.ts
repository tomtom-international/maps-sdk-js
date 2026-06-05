import type { HasLngLat, POICategory } from '@tomtom-org/maps-sdk/core';
import { getPosition, poiCategoriesToID } from '@tomtom-org/maps-sdk/core';
import { isNil } from 'lodash-es';
import type { CommonServiceParams } from '../serviceTypes';

/**
 * @ignore
 * @param urlParams
 * @param params
 */
export const appendCommonParams = (urlParams: URLSearchParams, params: CommonServiceParams): void => {
    urlParams.append('apiVersion', String(params.apiVersion));

    // TODO: restore apiAccessToken if we implement oauth2 access:
    // if (!params.apiAccessToken) {
    // Omit `key=` entirely when apiKey is empty so proxy deployments don't
    // surface their own key (or a placeholder) to the browser. The proxy
    // injects the real key server-side before forwarding upstream.
    if (params.apiKey) {
        urlParams.append('key', params.apiKey);
    }
    // }

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
