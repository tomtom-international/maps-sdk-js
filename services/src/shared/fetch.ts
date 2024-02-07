import { TomTomHeaders } from "@anw/maps-sdk-js/core";
import { FetchInput, PostObject } from "./types/fetch";

// Returns the response as a JSON object or throws an error if the response isn't successful.
const returnOrThrow = async <T>(response: Response): Promise<T> => {
    if (!response.ok) {
        const errorBody = response.bodyUsed && (await response.json());
        throw { status: response.status, message: response.statusText, data: errorBody };
    }
    return await response.json();
};

/**
 * Fetches the given HTTP JSON resource with an HTTP GET request and returns a promise with the response as a JSON object.
 * If the response isn't successful, it returns a rejected promise with the http error code.
 * @ignore
 * @param url The URL to fetch.
 * @param headers The headers to be sent with the request.
 */
export const get = async <T>(url: URL, headers: TomTomHeaders): Promise<T> =>
    returnOrThrow(await fetch(url, { headers }));

/**
 * Fetches the given HTTP JSON resource with an HTTP POST request and returns a promise with the response as a JSON object.
 * If the response isn't successful, it returns a rejected promise with the http error code.
 * @ignore
 * @param input The POST object with URL and optional payload.
 * @param headers The headers to be sent with the request.
 */
export const post = async <T, D>(input: PostObject<D>, headers: TomTomHeaders): Promise<T> =>
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
export const fetchWith = async <T, D = void>(input: FetchInput<D>, headers: TomTomHeaders): Promise<T> => {
    const method = input.method;
    if (method === "GET") {
        return get<T>(input.url, headers);
    } else if (method === "POST") {
        return post<T, D>(input, headers);
    } else {
        throw Error(`Unsupported HTTP method received: ${method}`);
    }
};
