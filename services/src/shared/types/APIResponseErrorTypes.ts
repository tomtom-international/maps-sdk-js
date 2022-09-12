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

export interface DefaultAPIResponseError extends BaseAPIResponseError {
    /*
     * A human-readable description of the error code.
     */
    error: string;
}

export interface GeocodeAPIResponseError extends BaseAPIResponseError {
    /*
     * A human-readable description of the error code.
     */
    errorText: string;
}

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

const enum APICode {
    TOO_MANY_REQUESTS = 429
}

export const APIErrorCode: { readonly [K in APICode as number]: string } = {
    [APICode.TOO_MANY_REQUESTS]: "Too Many Requests: The API Key is over QPS (Queries per second)"
};
