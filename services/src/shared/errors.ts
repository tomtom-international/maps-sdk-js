import type { ZodIssue } from 'zod';
import type { ValidationError } from './schema/validation';
import type { ParseResponseError } from './serviceTypes';
import type { APIErrorResponse, DefaultAPIResponseErrorBody } from './types/apiResponseErrorTypes';
import { APICode } from './types/apiResponseErrorTypes';
import type { ServiceName } from './types/servicesTypes';

/**
 * Base error class for all SDK-related errors.
 *
 * The SDK handles two distinct categories of errors:
 * 1. **Programming errors**: Configuration or usage errors in the user's application,
 *    such as passing incorrect types to parameters or functions.
 * 2. **API errors**: Recoverable errors that occur during SDK operations,
 *    such as network failures or invalid API responses.
 *
 * @example
 * ```typescript
 * try {
 *   // SDK operation
 * } catch (error) {
 *   if (error instanceof SDKError) {
 *     console.error(`Error in ${error.service}: ${error.message}`);
 *   }
 * }
 * ```
 *
 * @group Errors
 */
export class SDKError extends Error {
    /**
     * Creates a new SDKError instance.
     *
     * @param message - Human-readable error description
     * @param service - Name of the service where the error occurred
     * @param issues - Optional array of Zod validation issues for detailed error information
     */
    constructor(
        message: string,
        readonly service: string,
        readonly issues?: ZodIssue[],
    ) {
        super(message);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, SDKError);
        }
    }
}

/**
 * Mapping of API error codes to human-readable error messages.
 *
 * Provides standardized error messages for common API response codes,
 * ensuring consistent error handling across the SDK.
 *
 * @group Errors
 */
export const APIErrorCode: { readonly [K in APICode as number]: string } = {
    [APICode.TOO_MANY_REQUESTS]: 'Too Many Requests: The API Key is over QPS (Queries per second)',
    [APICode.FORBIDDEN]: 'Request failed with status code 403',
};

/**
 * Error class for HTTP API response errors.
 *
 * Extends {@link SDKError} to include HTTP status codes and automatically
 * maps known error codes to user-friendly messages using {@link APIErrorCode}.
 *
 * @example
 * ```typescript
 * throw new SDKServiceError('Invalid request', 'geocoding', 400);
 * ```
 *
 * @group Errors
 */
export class SDKServiceError extends SDKError {
    /**
     * HTTP status code of the failed API request.
     *
     * Common values:
     * - `400`: Bad Request
     * - `403`: Forbidden
     * - `429`: Too Many Requests
     * - `500`: Internal Server Error
     */
    status?: number;

    /**
     * Creates a new SDKServiceError instance.
     *
     * If the status code matches a known error in {@link APIErrorCode},
     * the message will be automatically replaced with the standardized message.
     *
     * @param message - Error message from the API or custom message
     * @param service - Name of the service that generated the error
     * @param status - HTTP status code of the failed request
     */
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
 * Error class for cancelled service calls.
 *
 * Thrown when the `signal` passed to a service call is aborted, either before the
 * request is sent or while it is in flight. Its `name` is `'AbortError'`, matching
 * the convention used by `fetch`, and the original abort reason — including a custom
 * value passed to `AbortController.abort(reason)` — is available on `cause`.
 *
 * @example
 * ```typescript
 * try {
 *   await search({ query: 'cafe', signal: controller.signal });
 * } catch (error) {
 *   if (error instanceof SDKAbortError) return; // superseded by a newer search
 *   throw error;
 * }
 * ```
 *
 * @group Errors
 */
export class SDKAbortError extends SDKError {
    /**
     * Creates a new SDKAbortError instance.
     *
     * @param service - Name of the service whose call was cancelled
     * @param cause - The abort reason carried by the signal
     */
    constructor(service: string, cause?: unknown) {
        super('The operation was aborted.', service);
        this.name = 'AbortError';
        this.cause = cause;
    }
}

/**
 * @ignore
 * @param error
 * @param serviceName
 */
export const parseDefaultResponseError: ParseResponseError<DefaultAPIResponseErrorBody> = (error, serviceName) => {
    const { data, message, status } = error;
    // Different services uses property error or errorText or detailedError
    // Here we cover all situations as a default error parser
    const errorMessage = data?.error || data?.errorText || message;
    return new SDKServiceError(errorMessage, serviceName, status);
};

/**
 * @ignore
 * Generate error for APIResponse, any other error type will be returned as it is.
 * @param error The error captured by a catch function.
 * @param serviceName The name of the service.
 * @param parseResponseError
 * @param signal The signal given to the call, used to recognise a cancellation.
 */
export const buildResponseError = (
    error: unknown,
    serviceName: ServiceName,
    parseResponseError?: ParseResponseError<unknown>,
    signal?: AbortSignal,
): SDKError => {
    // Checked before the status: an aborted fetch carries no status. Not a bare `signal?.aborted`
    // — `parseResponse` runs in the same `try`, so a real error thrown while the signal happens to
    // be aborted must not be reported as a cancellation. fetch rejects with exactly `signal.reason`.
    if (signal?.aborted && error === signal.reason) {
        return new SDKAbortError(serviceName, signal.reason);
    }

    // A custom `sendRequest` may mint its own AbortError instead.
    if (signal?.aborted && (error as Error)?.name === 'AbortError') {
        return new SDKAbortError(serviceName, signal.reason);
    }

    if ((error as APIErrorResponse).status) {
        const fetchError = error as APIErrorResponse;
        if (parseResponseError) {
            return parseResponseError(fetchError, serviceName);
        }
        return parseDefaultResponseError(fetchError, serviceName);
    }

    return new SDKError((error as Error).message, serviceName);
};

/**
 * @ignore
 * @param error
 * @param serviceName
 */
export const buildValidationError = (error: ValidationError, serviceName: ServiceName): SDKError =>
    new SDKError(error.message, serviceName, error.issues);
