import { APIResponseError } from "../shared/Errors";
import { ErrorObjAPI, GeocodeAPIResponseError } from "../shared/types/APIResponseErrorTypes";

/**
 * @ignore
 * @param apiError
 * @param serviceName
 */
export const geocodeResponseErrorParser: (
    apiError: ErrorObjAPI<GeocodeAPIResponseError>,
    serviceName: string
) => APIResponseError = (apiError, serviceName) => {
    const { data, message, status } = apiError;

    const errorMessage = data.errorText || message;

    return new APIResponseError(errorMessage, serviceName, status);
};
