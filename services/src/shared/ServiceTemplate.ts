import { CommonServiceParams, ServiceTemplate } from "./ServiceTypes";

/**
 * Template execution of a service call.
 * Any service goes through the same template steps:
 * 1- Build request
 * 2- Send request and get API response
 * 3- Parse and return API response
 * @param params The parameters for that specific service call.
 * @param template The implementation of the template steps.
 */
export const callService = async <PARAMS extends CommonServiceParams, REQUEST, RESPONSE>(
    params: PARAMS,
    template: ServiceTemplate<PARAMS, REQUEST, RESPONSE>
): Promise<RESPONSE> => {
    const request = template.buildRequest(params);
    const apiResponse = await template.sendRequest(request);
    return template.parseResponse(params, apiResponse);
};
