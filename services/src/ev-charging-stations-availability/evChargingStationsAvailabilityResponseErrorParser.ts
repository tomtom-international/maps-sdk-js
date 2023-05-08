import { SDKServiceError } from "../shared/errors";
import { ParseResponseError } from "../shared/serviceTypes";
import { DefaultAPIResponseError } from "../shared/types/apiResponseErrorTypes";

/**
 * @ignore
 * @param apiError
 * @param serviceName
 */
export const parseEVChargingStationsAvailabilityResponseError: ParseResponseError<DefaultAPIResponseError> = (
    apiError,
    serviceName
) => {
    const { data, message, status } = apiError;
    const errorMessage = data?.detailedError?.message || message;
    return new SDKServiceError(errorMessage, serviceName, status);
};
