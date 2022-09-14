/**
 * @ignore
 */
export interface BaseAPIResponseError {
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
export interface DefaultAPIResponseError extends BaseAPIResponseError {
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
 * @ignore
 */
export type ErrorObjAPI<T> = {
    status: number | undefined;
    message: string;
    data: T;
};

/**
 * @ignore
 */
export const enum APICode {
    TOO_MANY_REQUESTS = 429,
    FORBIDDEN = 403
}
