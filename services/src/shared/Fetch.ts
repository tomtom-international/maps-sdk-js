/**
 * Fetches the given URL and returns a promise with the response as a JSON object.
 * If the response isn't successful it returns a rejected promise with the http error code.
 * @param url The URL to fetch.
 * @param requestData Optional http parameters for the request.
 */
export const fetchJson = async <T>(url: URL, requestData?: RequestInit): Promise<T> => {
    const response = await fetch(url, requestData);
    return response.ok ? response.json() : Promise.reject(response.status);
};
