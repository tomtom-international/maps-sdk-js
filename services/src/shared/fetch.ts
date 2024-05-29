import type { TomTomHeaders } from "@anw/maps-sdk-js/core";
import type { FetchInput, PostObject } from "./types/fetch";
import type { ServiceResponse } from "./serviceTypes";

// Returns the response as a JSON object or throws an error if the response isn't successful.
const returnOrThrow = async <T>(response: Response): ServiceResponse<T> => {
    let message, errorBody;
    if (!response.ok) {
        // clone response to allow multiple uses of body object.
        // (try to parse as JSON first and as test if it throws an error)
        const responseClone = response.clone();
        if (!response.bodyUsed) {
            try {
                // if response body is not a valid JSON it will throw an error,
                errorBody = await response.json();
                message = errorBody?.errorText || errorBody?.message || errorBody?.detailedError?.message;
            } catch (e) {
                // so it's handled in catch as text (ex. "<h1>Developer Inactive</h1>")
                errorBody = await responseClone.text();
                message = response.statusText;
            }
        } else {
            message = response.statusText;
        }
        throw { status: response.status, message, data: errorBody };
    }
    return { data: await response.json(), status: response.status, statusText: response.statusText };
};

/**
 * Fetches the given HTTP JSON resource with an HTTP GET request and returns a promise with the response as a JSON object.
 * If the response isn't successful, it returns a rejected promise with the http error code.
 * @ignore
 * @param url The URL to fetch.
 * @param headers The headers to be sent with the request.
 */
export const get = async <T>(url: URL, headers: TomTomHeaders): ServiceResponse<T> =>
    returnOrThrow(await fetch(url, { headers }));

/**
 * Fetches the given HTTP JSON resource with an HTTP POST request and returns a promise with the response as a JSON object.
 * If the response isn't successful, it returns a rejected promise with the http error code.
 * @ignore
 * @param input The POST object with URL and optional payload.
 * @param headers The headers to be sent with the request.
 */
export const post = async <T, D>(input: PostObject<D>, headers: TomTomHeaders): ServiceResponse<T> =>
    returnOrThrow(
        await fetch(input.url, {
            method: "POST",
            body: JSON.stringify(input.data),
            headers: { ...headers, "Content-Type": "application/json" }
        })
    );

/**
 * Fetches the given HTTP JSON resource with the given HTTP operation and URL/Payload as applicable.
 * * Useful for services which can use different HTTP methods depending on the parameters.
 * @param input The input object (e.g. containing either GET or POST data)
 * @param headers The headers to be sent with the request.
 * @ignore
 */
export const fetchWith = async <T, D = void>(input: FetchInput<D>, headers: TomTomHeaders): ServiceResponse<T> => {
    const method = input.method;
    if (method === "GET") {
        return get<T>(input.url, headers);
    } else if (method === "POST") {
        return post<T, D>(input, headers);
    } else {
        throw Error(`Unsupported HTTP method received: ${method}`);
    }
};
