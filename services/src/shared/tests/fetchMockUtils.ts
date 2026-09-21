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

/**
 * Mocks fetch with a response that never settles until the request's own signal aborts,
 * at which point it rejects the way a real fetch does. Use it to test cancellation of an
 * in-flight request; `mockFetchResponse` resolves immediately, so nothing is ever pending.
 */
export const mockPendingFetch = () =>
    vi.spyOn(globalThis, 'fetch').mockImplementation(
        (_input, init) =>
            new Promise((_resolve, reject) => {
                const signal = init?.signal;
                if (!signal) return;
                signal.addEventListener(
                    'abort',
                    () => reject(signal.reason ?? new DOMException('The operation was aborted.', 'AbortError')),
                    { once: true },
                );
            }),
    );
