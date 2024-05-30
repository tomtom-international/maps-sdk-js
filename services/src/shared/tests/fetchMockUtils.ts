export const mockFetchResponse = (status: number, response?: any) =>
    jest.spyOn(global, "fetch").mockImplementation(() =>
        Promise.resolve({
            ok: status == 200,
            status,
            json: () => Promise.resolve(response),
            headers: {
                get: () => "application/json"
            }
        } as any)
    );
