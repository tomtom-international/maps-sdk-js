import axios from "axios";
import { FetchInput } from "./types/Fetch";

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

/**
 * Fetches the given HTTP JSON resource with the given HTTP operation and URL/Payload as applicable.
 * * Useful for services which can use different HTTP methods depending on the parameters.
 * @param input The input object (e.g. containing either GET or POST data)
 * @ignore
 */
export const fetchWith = async <T, D = void>(input: FetchInput<D>): Promise<T> => {
    const method = input.method;
    if (method === "GET") {
        return get<T>(input.url);
    } else if (method === "POST") {
        return post<T, D>(input);
    } else {
        throw Error(`Unsupported HTTP method received: ${method}`);
    }
};
