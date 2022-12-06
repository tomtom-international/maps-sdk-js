import { SDKServiceError } from "../shared/Errors";
import { ParseResponseError } from "../shared/ServiceTypes";
import { RoutingAPIResponseError } from "../shared/types/APIResponseErrorTypes";

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
