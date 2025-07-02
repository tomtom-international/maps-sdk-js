/**
 * @ignore
 */
export interface BaseAPIResponseErrorBody {
    /*
     * HTTP error code.
     */
    httpStatusCode: number;
    /*
     * Detailed information about the error.
     */
    detailedError: {
        /*
         * One of the defined error codes.
         */
        code: string;
        /*
         * A human-readable representation of the error code.
         */
        message: string;
        /*
         * Target of the particular error.
         * Value: The name of the request parameter.
         */
        target: string;
    };
}

/**
 * @ignore
 */
export interface DefaultAPIResponseErrorBody extends BaseAPIResponseErrorBody {
    /*
     * A human-readable description of the error code.
     */
    error?: string;
    errorText?: string;
}

/**
 * @ignore
 */
export interface RoutingAPIResponseError {
    /*
     * 	The format version
     */
    formatVersion: string;
    error: {
        /*
         * A human-readable representation of the error code.
         */
        description: string;
    };
    detailedError: {
        /*
         * A human-readable representation of the error code.
         */
        message: string;
        /*
         * One of the defined error codes.
         */
        code: string;
    };
}

/**
 * Error returned by an API.
 * @ignore
 */
export type APIErrorResponse<T = DefaultAPIResponseErrorBody> = {
    status?: number;
    message: string;
    data?: T;
};

/**
 * @ignore
 */
export enum APICode {
    TOO_MANY_REQUESTS = 429,
    FORBIDDEN = 403,
}
