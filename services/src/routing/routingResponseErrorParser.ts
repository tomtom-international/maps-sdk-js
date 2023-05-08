import { SDKServiceError } from "../shared/errors";
import { ParseResponseError } from "../shared/serviceTypes";
import { RoutingAPIResponseError } from "../shared/types/apiResponseErrorTypes";

/**
 * @ignore
 * @param apiError
 * @param serviceName
 */
export const parseRoutingResponseError: ParseResponseError<RoutingAPIResponseError> = (apiError, serviceName) => {
    const { data, message, status } = apiError;
    const errorMessage = data?.error?.description || message;
    return new SDKServiceError(errorMessage, serviceName, status);
};
