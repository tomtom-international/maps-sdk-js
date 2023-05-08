import { getLngLatArray, HasLngLat } from "@anw/maps-sdk-js/core";
import { CommonServiceParams } from "./serviceTypes";
import isNil from "lodash/isNil";
import { poiCategoriesToID, POICategory } from "../poi-categories/poiCategoriesToID";

/**
 * @ignore
 * @param urlParams
 * @param params
 */
export const appendCommonParams = (urlParams: URLSearchParams, params: CommonServiceParams): void => {
    urlParams.append("key", params.apiKey as string);
    params.language && urlParams.append("language", params.language);
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
    paramArray?: string[]
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
    values?: string[] | number[] | (string | number)[]
): void => {
    if (Array.isArray(values) && values.length > 0) {
        urlParams.append(name, values.join(","));
    }
};

/**
 * @ignore
 */
export const appendOptionalParam = (
    urlParams: URLSearchParams,
    name: string,
    value?: string | number | boolean
): void => {
    !isNil(value) && urlParams.append(name, String(value));
};

/**
 * Adds lat and lon parameters to the url.
 * @ignore
 * @param urlParams
 * @param position
 */
export const appendLatLonParamsFromPosition = (urlParams: URLSearchParams, position: HasLngLat | undefined): void => {
    const lngLat = position && getLngLatArray(position);
    if (lngLat) {
        urlParams.append("lat", String(lngLat[1]));
        urlParams.append("lon", String(lngLat[0]));
    }
};

/**
 * map human-readable poi categories to their ID.
 * @ignore
 * @param poiCategories
 */
export const mapPOICategoriesToIDs = (poiCategories: (number | POICategory)[]): number[] => {
    return poiCategories.map((poiCategory) => {
        if (typeof poiCategory !== "number") {
            return poiCategoriesToID[poiCategory];
        }
        return poiCategory;
    });
};
