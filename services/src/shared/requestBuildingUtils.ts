import type { HasLngLat, POICategory } from '@anw/maps-sdk-js/core';
import { getPosition } from '@anw/maps-sdk-js/core';
import isNil from 'lodash/isNil';
import { poiCategoriesToID } from '../poi-categories/poiCategoriesToID';
import type { CommonServiceParams } from './serviceTypes';

/**
 * @ignore
 * @param urlParams
 * @param params
 */
export const appendCommonParams = (
    urlParams: URLSearchParams,
    params: CommonServiceParams,
    routing?: boolean,
): void => {
    urlParams.append('apiVersion', String(params.apiVersion));
    if (!params.apiAccessToken) {
        urlParams.append('key', params.apiKey as string);
    }
    // else: access token is injected as a header elsewhere (see injectTomTomHeaders function)

    //TODO not sure if this is the best way to handle this, but for routing, language is only supported in the URL
    // if you request guidance instructions
    !routing && params.language && urlParams.append('language', params.language);
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
 * map human-readable poi categories to their ID.
 * @ignore
 * @param poiCategories
 */
export const mapPOICategoriesToIDs = (poiCategories: (number | POICategory)[]): number[] => {
    return poiCategories.map((poiCategory) => {
        if (typeof poiCategory !== 'number') {
            return poiCategoriesToID[poiCategory];
        }
        return poiCategory;
    });
};
