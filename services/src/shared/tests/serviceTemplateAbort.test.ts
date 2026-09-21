import { afterEach, describe, expect, test, vi } from 'vitest';
import { geocode } from '../../geocode';
import { SDKAbortError, SDKError, SDKServiceError } from '../errors';
import { mockFetchResponse, mockPendingFetch } from './fetchMockUtils';

const geocodeResponse = { summary: {}, results: [] };

describe('callService cancellation', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('rejects without sending a request when the signal is already aborted', async () => {
        const fetchMock = mockFetchResponse(200, geocodeResponse).mockClear();
        const onAPIRequest = vi.fn();
        const controller = new AbortController();
        controller.abort();

        await expect(geocode({ query: 'cafe', signal: controller.signal, onAPIRequest })).rejects.toBeInstanceOf(
            SDKAbortError,
        );

        expect(fetchMock).not.toHaveBeenCalled();
        expect(onAPIRequest).not.toHaveBeenCalled();
    });

    test('rejects with SDKAbortError when aborted in flight', async () => {
        mockPendingFetch();
        const controller = new AbortController();

        const pending = geocode({ query: 'cafe', signal: controller.signal });
        controller.abort();

        const error = await pending.catch((e) => e);
        expect(error).toBeInstanceOf(SDKAbortError);
        expect(error).toBeInstanceOf(SDKError);
        expect(error.name).toBe('AbortError');
        expect(error.service).toBe('Geocode');
    });

    test('carries a custom abort reason on cause', async () => {
        mockPendingFetch();
        const controller = new AbortController();

        const pending = geocode({ query: 'cafe', signal: controller.signal });
        controller.abort('superseded by a newer lookup');

        await expect(pending).rejects.toMatchObject({ cause: 'superseded by a newer lookup' });
    });

    test('resolves normally when a signal is given but never aborted', async () => {
        mockFetchResponse(200, geocodeResponse);
        const controller = new AbortController();

        const result = await geocode({ query: 'cafe', signal: controller.signal });

        expect(result.features).toEqual([]);
    });

    test('passing a signal does not fail request validation', async () => {
        mockFetchResponse(200, geocodeResponse);
        const controller = new AbortController();

        await expect(
            geocode({ query: 'cafe', signal: controller.signal, validateRequest: true }),
        ).resolves.toBeDefined();
    });

    test('reports a parse failure as itself, not as a cancellation, when the signal aborted first', async () => {
        const controller = new AbortController();
        // The caller cancels while the request is in flight, the response lands anyway, and the
        // body then turns out to be unparseable.
        vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
            controller.abort();
            return new Response('{}', { status: 200 });
        });

        const error = await geocode({ query: 'cafe', signal: controller.signal }).catch((e) => e);

        expect(error).toBeInstanceOf(SDKError);
        expect(error).not.toBeInstanceOf(SDKAbortError);
    });

    test('still reports API failures as SDKServiceError when a signal is given', async () => {
        mockFetchResponse(403);
        const controller = new AbortController();

        const error = await geocode({ query: 'cafe', signal: controller.signal }).catch((e) => e);
        expect(error).toBeInstanceOf(SDKServiceError);
        expect(error.status).toBe(403);
    });
});
