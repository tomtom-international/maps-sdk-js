import type { GlobalConfig, TomTomHeaders } from '@cet/maps-sdk-js/core';
import type { SDKServiceError } from './errors';
import type { APIErrorResponse, DefaultAPIResponseErrorBody } from './types/apiResponseErrorTypes';
import type { ParsedFetchResponse } from './types/fetch';
import type { RequestValidationConfig } from './types/validation';

/**
 * Common parameters shared across all service calls.
 *
 * @remarks
 * This type extends the global configuration and provides additional service-specific options
 * such as custom base URLs, request validation, and lifecycle event listeners.
 *
 * @typeParam ApiRequest - The type of the API request object
 * @typeParam ApiResponse - The type of the API response object
 *
 * @group Shared
 */
export type CommonServiceParams<ApiRequest = any, ApiResponse = any> = Partial<GlobalConfig> & {
    /**
     * Custom base URL for the service endpoint.
     *
     * @remarks
     * Should contain the URL up to the part that changes per service call.
     *
     * @example
     * ```ts
     * customServiceBaseURL: 'https://api.tomtom.com/search/10/reverseGeocode/'
     * ```
     *
     * @defaultValue `undefined` (uses default service URL)
     */
    customServiceBaseURL?: string;

    /**
     * Controls whether input request schema validation is performed.
     *
     * @remarks
     * When enabled, the SDK validates request parameters against the expected schema
     * before sending the request to the API. Set to `false` to skip validation.
     *
     * @defaultValue `true`
     */
    validateRequest?: boolean;

    /**
     * Callback invoked immediately before sending the request to the API.
     *
     * @remarks
     * Useful for tracking, logging, or debugging API requests before they are sent to the server.
     *
     * @param apiRequest - The API request to be sent (usually a URL for GET requests or URL with body for POST requests)
     */
    onAPIRequest?: (apiRequest: ApiRequest) => void;

    /**
     * Callback invoked when the raw response is received from the API.
     *
     * @remarks
     * Called as soon as the API response is received, before parsing.
     * The request object is the same reference as provided to {@link onAPIRequest}.
     * Useful for tracking, logging, or debugging successful API request-response pairs.
     *
     * @param apiRequest - The sent API request (same reference as in {@link onAPIRequest})
     * @param apiResponse - The received raw (unparsed) API response
     */
    onAPIResponse?: (apiRequest: ApiRequest, apiResponse: ApiResponse) => void;
};

/**
 * Function type for parsing API error responses into SDK service errors.
 *
 * @typeParam T - The type of the error response body (defaults to {@link DefaultAPIResponseErrorBody})
 *
 * @param apiError - The API error response received from the server
 * @param serviceName - The name of the service that encountered the error
 * @returns A structured {@link SDKServiceError} object
 *
 * @group Shared
 */
export type ParseResponseError<T = DefaultAPIResponseErrorBody> = (
    apiError: APIErrorResponse<T>,
    serviceName: string,
) => SDKServiceError;

/**
 * Template interface defining the lifecycle methods for any service implementation.
 *
 * @remarks
 * This type provides a standardized structure for implementing service calls,
 * including request building, validation, sending, response parsing, and error handling.
 *
 * @typeParam Params - Service-specific parameters extending {@link CommonServiceParams}
 * @typeParam ApiRequest - The type of the API request object
 * @typeParam ApiResponse - The type of the raw API response object
 * @typeParam Response - The type of the parsed response returned to the caller
 *
 * @group Shared
 */
export type ServiceTemplate<
    Params extends CommonServiceParams<ApiRequest, ApiResponse>,
    ApiRequest,
    ApiResponse,
    Response,
> = {
    /**
     * Configuration for validating request parameters.
     *
     * @remarks
     * Defines the validation schema and rules applied to request parameters
     * before the request is built and sent.
     */
    requestValidation?: RequestValidationConfig<Params>;

    /**
     * Builds the API request from the provided parameters.
     *
     * @param params - The service call parameters
     * @returns The constructed API request object
     */
    buildRequest: (params: Params) => ApiRequest;

    /**
     * Determines the API version to use for the service call.
     *
     * @remarks
     * Useful for services that require a specific API version different from the global configuration.
     * If not provided, the API version from the global or provided configuration will be used.
     *
     * @param params - Input parameters that may influence the API version selection
     * @returns The API version number
     */
    getAPIVersion?: (params?: Params) => number;

    /**
     * Sends the constructed request to the API server.
     *
     * @remarks
     * Handles the actual HTTP communication (e.g., GET or POST) with optional custom headers.
     *
     * @param request - The request object to send
     * @param headers - Custom TomTom headers to include in the request
     * @returns A promise resolving to the parsed fetch response
     */
    sendRequest: (request: ApiRequest, headers: TomTomHeaders) => ParsedFetchResponse<ApiResponse>;

    /**
     * Parses the successful API response into the expected return type.
     *
     * @remarks
     * Transforms the raw API response into a structured format suitable for the caller.
     *
     * @param apiResponse - The raw API response received from the server
     * @param params - The original service call parameters
     * @returns The parsed response object
     */
    parseResponse: (apiResponse: ApiResponse, params: Params) => Response;

    /**
     * Parses an API error response before propagating it to the caller.
     *
     * @remarks
     * Allows custom error handling and transformation of API errors into SDK-specific error types.
     */
    parseResponseError?: ParseResponseError<any>;
};
