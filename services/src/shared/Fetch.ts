import axios from "axios";

/**
 * Fetches the given HTTP JSON resource with an HTTP GET request and returns a promise with the response as a JSON object.
 * If the response isn't successful it returns a rejected promise with the http error code.
 * @ignore
 * @param url The URL to fetch.
 */
export const get = async <T>(url: URL): Promise<T> => {
    const response = await axios.get(url.toString());
    return response.data;
};

/**
 * POST object with URL and optional payload.
 * @ignore
 */
export type PostObject<D> = { url: URL; data?: D };

/**
 * Fetches the given HTTP JSON resource with an HTTP POST request and returns a promise with the response as a JSON object.
 * If the response isn't successful it returns a rejected promise with the http error code.
 * @ignore
 * @param input The POST object with URL and optional payload.
 */
export const post = async <T, D>(input: PostObject<D>): Promise<T> => {
    const response = await axios.post(input.url.toString(), input.data);
    return response.data;
};
