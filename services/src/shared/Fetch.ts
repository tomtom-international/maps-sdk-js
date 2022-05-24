export const fetchJson = async <T>(url: string, requestData?: RequestInit): Promise<T> => {
    const response = await fetch(url, requestData);
    return response.ok ? response.json() : Promise.reject(response.status);
};
