import { SDKServiceError } from "../shared/Errors";
import { ParseResponseError } from "../shared/ServiceTypes";
import { DefaultAPIResponseError } from "../shared/types/APIResponseErrorTypes";

/**
 * @ignore
 * @param apiError
 * @param serviceName
 */
export const chargingAvailabilityResponseErrorParser: ParseResponseError<DefaultAPIResponseError> = (
    apiError,
    serviceName
) => {
    const { data, message, status } = apiError;
    const errorMessage = data.detailedError.message || message;
    return new SDKServiceError(errorMessage, serviceName, status);
};
