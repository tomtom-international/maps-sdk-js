import type { GlobalConfig, TomTomHeaders } from "@anw/maps-sdk-js/core";
import type { SDKServiceError } from "./errors";
import type { APIErrorResponse, DefaultAPIResponseErrorBody } from "./types/apiResponseErrorTypes";
import type { RequestValidationConfig } from "./types/validation";

export type CommonServiceParams<API_REQUEST = any, API_RESPONSE = any> = Partial<GlobalConfig> & {
    /**
     * Optional, custom base URL for the service.
     ** Should contain the URL until the part that will change per service call.
     * Example: https://api.tomtom.com/search/10/reverseGeocode/
     */
    customServiceBaseURL?: string;

    /**
     * Optional, validation of input request schema.
     ** Providing true or skipping this param will result in input request schema validation,
     ** Providing false will skip schema validation
     * @default=true
     */
    validateRequest?: boolean;

    /**
     * Optional listener to the instant right before sending the request to the API (server).
     ** Useful to track or debug the API request for a service call.
     * @param request The API request to be sent (usually a URL for GET or URL + data for POST).
     */
    onAPIRequest?: (apiRequest: API_REQUEST) => void;

    /**
     * Optional listener for the instant when the raw (unparsed) response comes from the API (server).
     ** It will be called as soon as the API response is received.
     ** The request object is the same reference as with the previous onAPIRequest event.
     ** Useful to track or debug the API request and response for a successful service call.
     * @param apiRequest The sent API request (usually a URL for GET or URL + body for POST).
     * @param apiResponse The received raw (unparsed) API response.
     */
    onAPIResponse?: (apiRequest: API_REQUEST, apiResponse: API_RESPONSE) => void;
};

export type ParseResponseError<T = DefaultAPIResponseErrorBody> = (
    apiError: APIErrorResponse<T>,
    serviceName: string
) => SDKServiceError;

/**
 * Template functions for any service.
 */
export type ServiceTemplate<
    PARAMS extends CommonServiceParams<API_REQUEST, API_RESPONSE>,
    API_REQUEST,
    API_RESPONSE,
    RESPONSE
> = {
    /**
     * Optional configuration for request validation.
     */
    requestValidation?: RequestValidationConfig<PARAMS>;

    /**
     * Builds the request to be sent to the API.
     * @param params The parameters to build the request from.
     */
    buildRequest: (params: PARAMS) => API_REQUEST;

    /**
     * Optional getter for the API version to use.
     * * Useful for services that have an API version differing from the global config one.
     * * If not provided, the API version from global or provided configuration will be used.
     * @param params Input parameters to help determine the API version if needed.
     */
    getAPIVersion?: (params?: PARAMS) => number;

    /**
     * Sends the request to the API (e.g. via GET or POST, with or without custom headers).
     * @param request The request to send.
     */
    sendRequest: (request: API_REQUEST, headers: TomTomHeaders) => ServiceResponse<API_RESPONSE>;

    /**
     * Parses the API successful response before returning it to the caller.
     * @param apiResponse The API response to parse.
     * @param params The call parameters, if applicable for this service.
     */
    parseResponse: (apiResponse: API_RESPONSE, params: PARAMS) => RESPONSE;

    /**
     * Parses an API response error before throwing it back to the caller.
     */
    parseResponseError?: ParseResponseError<any>;
};

export type ServiceResponse<T> = Promise<{
    data: Promise<T>;
    status: number;
}>;
