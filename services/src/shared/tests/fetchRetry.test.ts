import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { get } from '../fetch';

const mockUrl = new URL('https://api.tomtom.com/test');
const mockHeaders = {};
const successBody = { result: 'ok' };

type MockResponseOptions = {
    status: number;
    body?: unknown;
    retryAfter?: string;
};

const createMockResponse = ({ status, body = successBody, retryAfter }: MockResponseOptions) =>
    ({
        ok: status >= 200 && status < 300,
        status,
        statusText: status === 429 ? 'Too Many Requests' : 'OK',
        bodyUsed: false,
        json: () => Promise.resolve(body),
        text: () => Promise.resolve(JSON.stringify(body)),
        headers: {
            get: (name: string) => {
                if (name === 'retry-after') return retryAfter ?? null;
                if (name === 'content-type') return 'application/json';
                return null;
            },
        },
    }) as unknown as Response;

describe('fetchWithRetry', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
        TomTomConfig.instance.reset();
    });

    test('succeeds immediately on 200', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(createMockResponse({ status: 200 }));

        const result = await get(mockUrl, mockHeaders);

        expect(result.status).toBe(200);
        expect(result.data).toEqual(successBody);
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    test('retries on 429 and succeeds on second attempt', async () => {
        vi.spyOn(globalThis, 'fetch')
            .mockResolvedValueOnce(createMockResponse({ status: 429, retryAfter: '1' }))
            .mockResolvedValueOnce(createMockResponse({ status: 200 }));

        const resultPromise = get(mockUrl, mockHeaders);
        await vi.advanceTimersByTimeAsync(1000);
        const result = await resultPromise;

        expect(result.status).toBe(200);
        expect(fetch).toHaveBeenCalledTimes(2);
    });

    test('retries multiple times with exponential backoff', async () => {
        vi.spyOn(globalThis, 'fetch')
            .mockResolvedValueOnce(createMockResponse({ status: 429, retryAfter: '1' }))
            .mockResolvedValueOnce(createMockResponse({ status: 429 })) // no Retry-After, uses backoff
            .mockResolvedValueOnce(createMockResponse({ status: 429 })) // no Retry-After, uses backoff
            .mockResolvedValueOnce(createMockResponse({ status: 200 }));

        TomTomConfig.instance.put({ retry: { initialWaitMs: 100, backoffFactor: 2 } });

        const resultPromise = get(mockUrl, mockHeaders);

        // 1st retry: Retry-After says 1s
        await vi.advanceTimersByTimeAsync(1000);
        // 2nd retry: no header, backoff = 100 * 2 = 200ms (initialWait was used for calculation, but after 1st retry backoffMs *= factor)
        await vi.advanceTimersByTimeAsync(200);
        // 3rd retry: no header, backoff = 200 * 2 = 400ms
        await vi.advanceTimersByTimeAsync(400);

        const result = await resultPromise;

        expect(result.status).toBe(200);
        expect(fetch).toHaveBeenCalledTimes(4);
    });

    test('respects Retry-After header', async () => {
        vi.spyOn(globalThis, 'fetch')
            .mockResolvedValueOnce(createMockResponse({ status: 429, retryAfter: '3' }))
            .mockResolvedValueOnce(createMockResponse({ status: 200 }));

        const resultPromise = get(mockUrl, mockHeaders);

        // Should not resolve after 2s
        await vi.advanceTimersByTimeAsync(2000);
        expect(fetch).toHaveBeenCalledTimes(1);

        // Should retry after 3s total
        await vi.advanceTimersByTimeAsync(1000);
        const result = await resultPromise;

        expect(result.status).toBe(200);
        expect(fetch).toHaveBeenCalledTimes(2);
    });

    test('gives up when timeout is exceeded', async () => {
        vi.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.resolve(createMockResponse({ status: 429 })));

        // Short delays so the test runs fast: 10ms, 20ms, then 30+40=70 > 50 → gives up
        TomTomConfig.instance.put({ retry: { initialWaitMs: 10, backoffFactor: 2, timeoutMs: 50 } });

        const assertion = expect(get(mockUrl, mockHeaders)).rejects.toMatchObject({ status: 429 });
        await vi.advanceTimersByTimeAsync(100);
        await assertion;

        expect(fetch).toHaveBeenCalledTimes(3);
    });

    test('does not retry when retry is explicitly disabled', async () => {
        TomTomConfig.instance.put({ retry: undefined });

        vi.spyOn(globalThis, 'fetch').mockResolvedValue(createMockResponse({ status: 429 }));

        await expect(get(mockUrl, mockHeaders)).rejects.toMatchObject({
            status: 429,
        });
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    test('does not retry on non-429 errors', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(createMockResponse({ status: 500 }));

        await expect(get(mockUrl, mockHeaders)).rejects.toMatchObject({
            status: 500,
        });
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    test('uses exponential backoff when Retry-After header is missing', async () => {
        vi.spyOn(globalThis, 'fetch')
            .mockResolvedValueOnce(createMockResponse({ status: 429 }))
            .mockResolvedValueOnce(createMockResponse({ status: 429 }))
            .mockResolvedValueOnce(createMockResponse({ status: 200 }));

        TomTomConfig.instance.put({ retry: { initialWaitMs: 100, backoffFactor: 3 } });

        const resultPromise = get(mockUrl, mockHeaders);

        // 1st retry: 100ms (initialWait)
        await vi.advanceTimersByTimeAsync(100);
        // 2nd retry: 300ms (100 * 3)
        await vi.advanceTimersByTimeAsync(300);

        const result = await resultPromise;

        expect(result.status).toBe(200);
        expect(fetch).toHaveBeenCalledTimes(3);
    });

    test('custom config overrides defaults', async () => {
        vi.spyOn(globalThis, 'fetch')
            .mockResolvedValueOnce(createMockResponse({ status: 429 }))
            .mockResolvedValueOnce(createMockResponse({ status: 200 }));

        TomTomConfig.instance.put({ retry: { initialWaitMs: 500 } });

        const resultPromise = get(mockUrl, mockHeaders);

        // Should not retry after 400ms
        await vi.advanceTimersByTimeAsync(400);
        expect(fetch).toHaveBeenCalledTimes(1);

        // Should retry after 500ms
        await vi.advanceTimersByTimeAsync(100);
        const result = await resultPromise;

        expect(result.status).toBe(200);
        expect(fetch).toHaveBeenCalledTimes(2);
    });
});
