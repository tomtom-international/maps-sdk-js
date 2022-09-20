import { SDKServiceError } from "../shared/Errors";
import { ParseRequestError } from "../shared/ServiceTypes";
import { RoutingAPIResponseError } from "../shared/types/APIResponseErrorTypes";

/**
 * @ignore
 * @param apiError
 * @param serviceName
 */
export const routingResponseErrorParser: ParseRequestError<RoutingAPIResponseError> = (apiError, serviceName) => {
    const { data, message, status } = apiError;

    const errorMessage = data.error.description || message;

    return new SDKServiceError(errorMessage, serviceName, status);
};
