import { isProxyCredentialsMode, RetryConfig, TomTomConfig, type TomTomHeaders } from '@tomtom-org/maps-sdk/core';
import type { FetchInput, GetObject, ParsedFetchResponse, PostObject, RequestOptions } from './types/fetch';

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

// Waits for the given duration, rejecting with the abort reason if the signal fires.
const sleep = (ms: number, signal?: AbortSignal): Promise<void> =>
    new Promise((resolve, reject) => {
        // addEventListener never fires for an abort that already happened
        if (signal?.aborted) {
            reject(signal.reason);
            return;
        }
        const onAbort = () => {
            clearTimeout(timer);
            reject(signal?.reason);
        };
        const timer = setTimeout(() => {
            signal?.removeEventListener('abort', onAbort);
            resolve();
        }, ms);
        signal?.addEventListener('abort', onAbort, { once: true });
    });

/**
 * Wraps a fetch call with automatic retry on 429 (Too Many Requests) responses.
 * Respects the Retry-After header when present, otherwise uses exponential backoff.
 * A given signal cancels both the in-flight request and any pending backoff wait.
 * @ignore
 */
const fetchWithRetry = async (fetchFn: () => Promise<Response>, signal?: AbortSignal): Promise<Response> => {
    const retryConfig = TomTomConfig.instance.get().retry;
    if (!retryConfig) {
        return fetchFn();
    }

    const { initialWaitMs, backoffFactor, timeoutMs } = retryConfig as Required<RetryConfig>;

    const startTime = Date.now();
    let backoffMs = initialWaitMs;
    let response = await fetchFn();

    while (response.status === 429) {
        const retryAfterSeconds = Number.parseInt(response.headers.get('retry-after') ?? '', 10);
        const waitMs = Number.isFinite(retryAfterSeconds) ? retryAfterSeconds * 1000 : backoffMs;

        if (Date.now() - startTime + waitMs > timeoutMs) {
            break;
        }

        // Drain the body to free the connection
        await response.text().catch(() => {});

        await sleep(waitMs, signal);
        backoffMs *= backoffFactor;
        response = await fetchFn();
    }

    return response;
};

const proxyModeCredentials = (): RequestCredentials | undefined => (isProxyCredentialsMode() ? 'include' : undefined);

/**
 * Fetches the given HTTP JSON resource with an HTTP GET request and returns a promise with the response as a JSON object.
 * If the response isn't successful, it returns a rejected promise with the http error code.
 * @ignore
 * @param input A URL or a GET object with URL and optional service-specific headers.
 * @param sdkHeaders SDK-wide TomTom headers to be sent with the request.
 * @param options Per-call HTTP options, such as the `AbortSignal` used to cancel the request.
 */
export const get = async <T>(
    input: URL | GetObject,
    sdkHeaders: TomTomHeaders,
    options?: RequestOptions,
): ParsedFetchResponse<T> =>
    returnOrThrow(
        await fetchWithRetry(() => {
            const credentials = proxyModeCredentials();
            const { url, headers: inputHeaders } = input instanceof URL ? { url: input, headers: undefined } : input;
            const init: RequestInit = { headers: { ...sdkHeaders, ...inputHeaders } };
            if (credentials) init.credentials = credentials;
            if (options?.signal) init.signal = options.signal;

            return fetch(url, init);
        }, options?.signal),
    );

/**
 * Fetches the given HTTP JSON resource with an HTTP POST request and returns a promise with the response as a JSON object.
 * If the response isn't successful, it returns a rejected promise with the http error code.
 * @ignore
 * @param input The POST object with URL, optional payload, and optional service-specific headers.
 * @param sdkHeaders SDK-wide TomTom headers to be sent with the request.
 * @param options Per-call HTTP options, such as the `AbortSignal` used to cancel the request.
 */
export const post = async <T, D>(
    input: PostObject<D>,
    sdkHeaders: TomTomHeaders,
    options?: RequestOptions,
): ParsedFetchResponse<T> =>
    returnOrThrow(
        await fetchWithRetry(() => {
            const credentials = proxyModeCredentials();
            const init: RequestInit = {
                method: 'POST',
                body: JSON.stringify(input.data),
                headers: { ...sdkHeaders, ...input.headers, 'Content-Type': 'application/json' },
            };
            if (credentials) init.credentials = credentials;
            if (options?.signal) init.signal = options.signal;

            return fetch(input.url, init);
        }, options?.signal),
    );

/**
 * Fetches the given HTTP JSON resource with the given HTTP operation and URL/Payload as applicable.
 * * Useful for services which can use different HTTP methods depending on the parameters.
 * @param input The input object (e.g. containing either GET or POST data)
 * @param sdkHeaders SDK-wide TomTom headers to be sent with the request.
 * @param options Per-call HTTP options, such as the `AbortSignal` used to cancel the request.
 * @ignore
 */
export const fetchWith = async <T, D = void>(
    input: FetchInput<D>,
    sdkHeaders: TomTomHeaders,
    options?: RequestOptions,
): ParsedFetchResponse<T> => {
    if (input.method === 'GET') return get<T>(input, sdkHeaders, options);
    if (input.method === 'POST') return post<T, D>(input, sdkHeaders, options);
    throw new Error(`Unsupported HTTP method received: ${(input as { method: string }).method}`);
};
