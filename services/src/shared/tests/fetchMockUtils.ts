import { vi } from 'vitest';

export const mockFetchResponse = (status: number, response?: any) =>
    vi.spyOn(global, 'fetch').mockImplementation(() =>
        Promise.resolve({
            ok: status === 200,
            status,
            json: () => Promise.resolve(response),
            headers: {
                get: () => 'application/json',
            },
        } as any),
    );
