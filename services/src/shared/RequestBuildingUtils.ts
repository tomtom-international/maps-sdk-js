import { CommonServiceParams } from "./ServiceTypes";
import isNil from "lodash/isNil";

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
    values?: string[] | number[]
): void => {
    if (Array.isArray(values) && values.length > 0) {
        urlParams.append(name, values.join(","));
    }
};

/**
 * @ignore
 */
export const appendParameter = (urlParams: URLSearchParams, name: string, value?: string | number): void => {
    !isNil(value) && urlParams.append(name, String(value));
};
