import { AxiosError } from "axios";
import { ParseRequestError } from "./ServiceTypes";
import { APICode, DefaultAPIResponseError } from "./types/APIResponseErrorTypes";
import { ValidationError, ValidationErrorResponse } from "./Validation";

/**
 * Main Error Class for the whole SDK to help with error handling.
 *  SDK has two different types of errors:
 *  1. Programming errors: These are programming and configuration errors in the user application, like incorrect usage of the SDK(such as passing wrong type to parameter/function)
 *  2. API errors: These include recoverable errors that occur within the SDK implementation.
 *
 * @group Shared
 * @category
 */
export class SDKError extends Error {
    constructor(message: string, private service: string, private errors?: ValidationErrorResponse) {
        super(message);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, SDKError);
        }
    }
}

export const APIErrorCode: { readonly [K in APICode as number]: string } = {
    [APICode.TOO_MANY_REQUESTS]: "Too Many Requests: The API Key is over QPS (Queries per second)",
    [APICode.FORBIDDEN]: "Request failed with status code 403"
};

/**
 * API Response Error Class for the handle API error responses.
 * @group Shared
 * @category Types
 */
export class SDKServiceError extends SDKError {
    status?: number;

    constructor(message: string, service: string, status?: number) {
        super(message, service);
        this.status = status;

        /*
         * We use as message what returns from API if any, otherwise we have our APIErrorCode as a fallback
         * Check if there is a status and if the status exists in the mapped API error types
         */
        if (this.status && APIErrorCode[this.status]) {
            this.message = APIErrorCode[this.status];
        }
    }
}

/**
 * @ignore
 * @param error
 * @param serviceName
 */
export const defaultResponseParserError: ParseRequestError<DefaultAPIResponseError> = (error, serviceName) => {
    const { data, message, status } = error;

    // Different services uses property error or errorText
    // Here we cover both situations as a default error parser
    const errorMessage = data?.error || data?.errorText || message;

    return new SDKServiceError(errorMessage, serviceName, status);
};

/**
 * @ignore
 * Generate error for APIResponse, any other error type will be returned as it is.
 * @param error The error captured by a catch function.
 * @param serviceName The name of the service.
 * @param parserResponseError
 */
export const generateError = (
    error: unknown,
    serviceName: string,
    parserResponseError?: ParseRequestError<unknown>
): SDKError => {
    if (error instanceof AxiosError) {
        const errorObj = {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        };

        if (parserResponseError) {
            return parserResponseError(errorObj, serviceName);
        } else {
            return defaultResponseParserError(errorObj, serviceName);
        }
    }

    // Validation Error has errors property with all errors from validation
    const errors = error instanceof ValidationError ? error.errors : undefined;

    return new SDKError((error as Error).message, serviceName, errors);
};
