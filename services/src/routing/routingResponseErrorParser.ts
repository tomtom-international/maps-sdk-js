import type { ParseResponseError } from "../shared";
import { SDKServiceError } from "../shared";
import type { RoutingAPIResponseError } from "../shared/types/apiResponseErrorTypes";

/**
 * @ignore
 * @param apiError
 * @param serviceName
 */
export const parseRoutingResponseError: ParseResponseError<RoutingAPIResponseError> = (apiError, serviceName) => {
    const { data, message, status } = apiError;
    const errorMessage = data?.error?.description ?? data?.detailedError?.message ?? message;
    return new SDKServiceError(errorMessage, serviceName, status);
};
