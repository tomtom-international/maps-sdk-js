import { ParseResponseError, SDKServiceError } from "../shared";

/**
 * @ignore
 * @param apiError
 * @param serviceName
 */
export const parseEVChargingStationsAvailabilityResponseError: ParseResponseError = (apiError, serviceName) => {
    const errorMessage = apiError.data?.detailedError?.message || apiError.message;
    return new SDKServiceError(errorMessage, serviceName, apiError.status);
};
