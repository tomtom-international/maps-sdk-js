import { mergeFromGlobal } from "@anw/go-sdk-js/core";
import { generateError } from "./Errors";
import { Services } from "./types/ServicesTypes";
import { CommonServiceParams, ServiceTemplate } from "./ServiceTypes";
import { validateRequestSchema } from "./Validation";

/**
 * @ignore
 * Template execution of a service call.
 * Any service goes through the same template steps:
 * 1- Build request
 * 2- Send request and get API response
 * 3- Parse and return API response
 * @param params The parameters for that specific service call.
 * @param template The implementation of the template steps.
 * @param serviceName The name of the service.
 */
export const callService = async <PARAMS extends CommonServiceParams, REQUEST, API_RESPONSE, RESPONSE>(
    params: PARAMS,
    template: ServiceTemplate<PARAMS, REQUEST, API_RESPONSE, RESPONSE>,
    serviceName: Services
): Promise<RESPONSE> => {
    try {
        const mergedParams = mergeFromGlobal(params);
        const validatedParams = validateRequestSchema(mergedParams, template.validateRequestSchema);
        const request = template.buildRequest(validatedParams);
        const apiResponse = await template.sendRequest(request);
        return template.parseResponse(apiResponse, mergedParams);
    } catch (e) {
        return Promise.reject(generateError(e, serviceName, template.parseRequestError));
    }
};
