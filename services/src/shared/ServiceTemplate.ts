import axios from "axios";
import { mergeFromGlobal, generateTomTomCustomHeaders } from "@anw/go-sdk-js/core";
import { buildResponseError, buildValidationError } from "./Errors";
import { ServiceName } from "./types/ServicesTypes";
import { CommonServiceParams, ServiceTemplate } from "./ServiceTypes";
import { validateRequestSchema, ValidationError } from "./Validation";

/**
 * Inject custom headers to axios requests
 * @param params -  Common Service parameters configuration
 */
const injectCustomHeaders = (params: CommonServiceParams): void => {
    const tomtomHeaders = generateTomTomCustomHeaders(params);

    // Injecting custom headers to axios
    axios.defaults.headers.common = {
        ...tomtomHeaders
    };
};

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
    serviceName: ServiceName
): Promise<RESPONSE> => {
    const mergedParams = mergeFromGlobal(params);
    if (params.validateRequest || params.validateRequest == undefined) {
        try {
            validateRequestSchema(mergedParams, template.requestValidation);
        } catch (e) {
            return Promise.reject(buildValidationError(e as ValidationError, serviceName));
        }
    }
    const request = template.buildRequest(mergedParams);

    injectCustomHeaders(mergedParams);

    let apiResponse;
    try {
        apiResponse = await template.sendRequest(request);
    } catch (e) {
        return Promise.reject(buildResponseError(e, serviceName, template.parseResponseError));
    }
    return template.parseResponse(apiResponse, mergedParams);
};
