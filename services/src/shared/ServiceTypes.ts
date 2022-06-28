export type CommonServiceOptions<REQUEST, RESPONSE> = {
    /**
     * Optional, custom base URL for the service.
     * Should contain the URL until the part that will change per service call.
     * Example: https://api.tomtom.com/search/10/reverseGeocode/
     */
    customBaseURL?: string;

    /**
     * Optionally updates the built request before sending it to the API.
     * @param request The built request to be updated before it's sent.
     */
    updateRequest?: (request: REQUEST) => REQUEST;

    /**
     * Optionally updates the parsed response before returning it.
     * @param response The parsed response to be updated before it's returned.
     */
    updateResponse?: (response: RESPONSE) => RESPONSE;
};
