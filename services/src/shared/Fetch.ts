import axios, { AxiosError } from "axios";

/**
 * Fetches the given URL and returns a promise with the response as a JSON object.
 * If the response isn't successful it returns a rejected promise with the http error code.
 * @ignore
 * @param url The URL to fetch.
 */
export const fetchJson = async <T>(url: URL): Promise<T> => {
    try {
        const response = await axios.get(url.toString());
        return response.status < 400 ? response.data : Promise.reject(response.status);
    } catch (error) {
        return Promise.reject((error as AxiosError).response?.status);
    }
};
