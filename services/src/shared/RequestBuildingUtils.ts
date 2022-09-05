import { CommonServiceParams } from "./ServiceTypes";

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
