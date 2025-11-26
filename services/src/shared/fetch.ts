import type { TomTomHeaders } from '@tomtom-org/maps-sdk/core';
import type { FetchInput, ParsedFetchResponse, PostObject } from './types/fetch';

/**
 * Custom error class for HTTP fetch errors.
 */
class FetchError extends Error {
    public readonly status: number;
    public readonly data?: unknown;

    constructor(status: number, message?: string, data?: unknown) {
        super(message ?? `HTTP Error ${status}`);
        this.name = 'FetchError';
        this.status = status;
        this.data = data;

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, FetchError);
        }
    }
}

// Returns the response as a JSON object or throws an error if the response isn't successful.
const returnOrThrow = async <T>(response: Response): ParsedFetchResponse<T> => {
    if (response.ok) {
        return { data: await response.json(), status: response.status };
    }
    let message: string | undefined;
    let errorBody;
    const contentType = response.headers.get('content-type');
    if (response.bodyUsed) {
        message = response.statusText;
    } else if (contentType?.includes('application/json')) {
        errorBody = await response.json();
        message = errorBody?.errorText ?? errorBody?.message ?? errorBody?.detailedError?.message;
    } else if (contentType?.includes('text/xml')) {
        errorBody = await response.text();
        message = response.statusText;
    }

    throw new FetchError(response.status, message, errorBody);
};

/**
 * Fetches the given HTTP JSON resource with an HTTP GET request and returns a promise with the response as a JSON object.
 * If the response isn't successful, it returns a rejected promise with the http error code.
 * @ignore
 * @param url The URL to fetch.
 * @param headers The headers to be sent with the request.
 */
export const get = async <T>(url: URL, headers: TomTomHeaders): ParsedFetchResponse<T> =>
    returnOrThrow(await fetch(url, { headers }));

/**
 * Fetches the given HTTP JSON resource with an HTTP POST request and returns a promise with the response as a JSON object.
 * If the response isn't successful, it returns a rejected promise with the http error code.
 * @ignore
 * @param input The POST object with URL and optional payload.
 * @param headers The headers to be sent with the request.
 */
export const post = async <T, D>(input: PostObject<D>, headers: TomTomHeaders): ParsedFetchResponse<T> =>
    returnOrThrow(
        await fetch(input.url, {
            method: 'POST',
            body: JSON.stringify(input.data),
            headers: { ...headers, 'Content-Type': 'application/json' },
        }),
    );

/**
 * Fetches the given HTTP JSON resource with the given HTTP operation and URL/Payload as applicable.
 * * Useful for services which can use different HTTP methods depending on the parameters.
 * @param input The input object (e.g. containing either GET or POST data)
 * @param headers The headers to be sent with the request.
 * @ignore
 */
export const fetchWith = async <T, D = void>(input: FetchInput<D>, headers: TomTomHeaders): ParsedFetchResponse<T> => {
    const method = input.method;
    if (method === 'GET') {
        return get<T>(input.url, headers);
    }
    if (method === 'POST') {
        return post<T, D>(input, headers);
    }
    throw new Error(`Unsupported HTTP method received: ${method}`);
};
