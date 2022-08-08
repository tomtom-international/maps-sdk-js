import { GlobalConfig } from "@anw/go-sdk-js/core";

/**
 * @group Shared
 */
export type CommonServiceParams = Partial<GlobalConfig> & {
    /**
     * Optional, custom base URL for the service.
     * Should contain the URL until the part that will change per service call.
     * Example: https://api.tomtom.com/search/10/reverseGeocode/
     * @group Utility
     */
    customServiceBaseURL?: string;
};

/**
 * Template functions for any service.
 * @group Utility
 */
export type ServiceTemplate<PARAMS extends CommonServiceParams, REQUEST, API_RESPONSE, RESPONSE> = {
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
     * Parses the API response before returning it to the caller.
     * @param apiResponse The API response to parse.
     * @param params The call parameters, if applicable for this service.
     */
    parseResponse: (apiResponse: API_RESPONSE, params: PARAMS) => RESPONSE;
};
