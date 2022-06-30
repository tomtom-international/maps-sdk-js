import { GlobalConfig } from "core";

export type CommonServiceParams = GlobalConfig & {
    /**
     * Optional, custom base URL for the service.
     * Should contain the URL until the part that will change per service call.
     * Example: https://api.tomtom.com/search/10/reverseGeocode/
     */
    customBaseURL?: string;
};

/**
 * Template functions for any service.
 */
export type ServiceTemplate<PARAMS extends CommonServiceParams, REQUEST, RESPONSE> = {
    /**
     * Builds the request to be sent to the API.
     * @param params The parameters to build the request from.
     */
    buildRequest: (params: PARAMS) => REQUEST;

    /**
     * Sends the request to the API (e.g. via GET or POST, with or without custom headers).
     * @param request The request to send.
     */
    sendRequest: (request: REQUEST) => Promise<any>;

    /**
     * Parses the API response before returning it to the caller.
     * @param params The call parameters.
     * @param apiResponse The API response to parse.
     */
    parseResponse: (params: PARAMS, apiResponse: any) => RESPONSE;
};
