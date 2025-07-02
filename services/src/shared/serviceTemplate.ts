import { generateTomTomHeaders, mergeFromGlobal } from '@anw/maps-sdk-js/core';
import { buildResponseError, buildValidationError } from './errors';
import type { ServiceName } from './types/servicesTypes';
import type { CommonServiceParams, ServiceTemplate } from './serviceTypes';
import type { ValidationError } from './validation';
import { validateRequestSchema } from './validation';

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
export const callService = async <PARAMS extends CommonServiceParams, ApiRequest, ApiResponse, RESPONSE>(
    params: PARAMS,
    template: ServiceTemplate<PARAMS, ApiRequest, ApiResponse, RESPONSE>,
    serviceName: ServiceName,
): Promise<RESPONSE> => {
    const customAPIVersion = template.getAPIVersion?.(params);
    const mergedParams = mergeFromGlobal({ ...params, ...(customAPIVersion && { apiVersion: customAPIVersion }) });
    // (params.validateRequest defaults to true, thus true and undefined are the same)
    if (params.validateRequest === undefined || params.validateRequest) {
        try {
            validateRequestSchema<PARAMS>(mergedParams, template.requestValidation);
        } catch (e) {
            return Promise.reject(buildValidationError(e as ValidationError, serviceName));
        }
    }
    const apiRequest = template.buildRequest(mergedParams);
    const headers = generateTomTomHeaders(mergedParams);
    params.onAPIRequest?.(apiRequest);

    try {
        const apiResponse = await template.sendRequest(apiRequest, headers);
        params.onAPIResponse?.(apiRequest, apiResponse);
        return template.parseResponse(await apiResponse.data, mergedParams);
    } catch (e) {
        params.onAPIResponse?.(apiRequest, e);
        return Promise.reject(buildResponseError(e, serviceName, template.parseResponseError));
    }
};
