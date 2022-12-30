import { GlobalConfig } from "@anw/go-sdk-js/core";
import { SDKServiceError } from "./Errors";
import { ErrorObjAPI } from "./types/APIResponseErrorTypes";
import { RequestValidationConfig } from "./types/Validation";

/**
 * @group Shared
 * @category Types
 */
export type CommonServiceParams = Partial<GlobalConfig> & {
    /**
     * Optional, custom base URL for the service.
     * Should contain the URL until the part that will change per service call.
     * Example: https://api.tomtom.com/search/10/reverseGeocode/
     */
    customServiceBaseURL?: string;

    /**
     * Optional, validation of input request schema.
     * Providing true or skipping this param will result in input request schema validation,
     * Providing false will skip schema validation
     * @default=true
     */
    validateRequest?: boolean;
};

/**
 * @group Shared
 * @category Types
 */
export type ParseResponseError<T> = (apiError: ErrorObjAPI<T>, serviceName: string) => SDKServiceError;

/**
 * Template functions for any service.
 * @group Shared
 * @category Types
 */
export type ServiceTemplate<PARAMS extends CommonServiceParams, REQUEST, API_RESPONSE, RESPONSE> = {
    /**
     * Optional configuration for request validation.
     */
    requestValidation?: RequestValidationConfig;

    /**
     * Builds the request to be sent to the API.
     * @param params The parameters to build the request from.
     */
    buildRequest: (params: PARAMS) => REQUEST;

    /**
     * Sends the request to the API (e.g. via GET or POST, with or without custom headers).
     * @param request The request to send.
     */
    sendRequest: (request: REQUEST) => Promise<API_RESPONSE>;

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
