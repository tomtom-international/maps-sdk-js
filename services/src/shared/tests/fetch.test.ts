import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { afterAll, afterEach, describe, expect, test } from 'vitest';
import { geocode } from '../../geocode';
import { fetchWith, get, post } from '../fetch';
import { mockFetchResponse } from './fetchMockUtils';

describe('Fetch utility tests', () => {
    const unMockedFetch = global.fetch;
    afterAll(() => (global.fetch = unMockedFetch));
    // Tests below mutate TomTomConfig (apiKey / commonBaseURL) to flip the
    // SDK between direct and proxy modes; reset back to defaults after each.
    afterEach(() => {
        TomTomConfig.instance.put({ apiKey: '', commonBaseURL: 'https://api.tomtom.com' });
    });

    describe('Get tests', () => {
        const headers = { 'tomtom-user-agent': 'TEST/1' };

        test('OK response', async () => {
            const fetchMock = mockFetchResponse(200, { id: 'some json' });
            expect(await get(new URL('https://blah1234.com'), headers)).toEqual({
                data: {
                    id: 'some json',
                },
                status: 200,
            });
            expect(fetchMock).toHaveBeenCalledWith(new URL('https://blah1234.com'), { headers });
        });

        test('Failed response from rejected promise', async () => {
            mockFetchResponse(410);
            await expect(get(new URL('https://blah1234.com'), headers)).rejects.toHaveProperty('status', 410);
        });
    });

    describe('Post tests', () => {
        const headers = { 'tomtom-user-agent': 'TEST/1' };

        test('OK response', async () => {
            mockFetchResponse(200, { id: 'some json' });
            expect(await post({ url: new URL('https://blah1234.com') }, headers)).toEqual({
                data: {
                    id: 'some json',
                },
                status: 200,
            });
        });

        test('Failed response from rejected promise', async () => {
            mockFetchResponse(410);
            await expect(post({ url: new URL('https://blah1234.com') }, headers)).rejects.toHaveProperty('status', 410);
        });
    });

    describe('Fetch-with tests', () => {
        const headers = { 'tomtom-user-agent': 'TEST/1' };

        test('OK GET response', async () => {
            mockFetchResponse(200, { id: 'some json' });
            expect(await fetchWith({ method: 'GET', url: new URL('https://blah1234.com') }, headers)).toStrictEqual({
                data: {
                    id: 'some json',
                },
                status: 200,
            });
        });

        test('OK POST response', async () => {
            mockFetchResponse(200, { id: 'some json' });
            expect(await fetchWith({ method: 'POST', url: new URL('https://blah1234.com') }, headers)).toStrictEqual({
                data: {
                    id: 'some json',
                },
                status: 200,
            });
        });

        test('Failed POST response from rejected promise', async () => {
            mockFetchResponse(410);
            await expect(
                fetchWith({ method: 'POST', url: new URL('https://blah1234.com') }, headers),
            ).rejects.toHaveProperty('status', 410);
        });

        test('Incorrect HTTP method', async () => {
            await expect(
                fetchWith({ method: 'UNSUPPORTED' as never, url: new URL('https://blah1234.com') }, headers),
            ).rejects.toHaveProperty('message', 'Unsupported HTTP method received: UNSUPPORTED');
        });
    });

    describe('credentials (proxy-mode-only)', () => {
        test('direct mode (default commonBaseURL): get omits credentials', async () => {
            const fetchMock = mockFetchResponse(200, { id: 'ok' });
            TomTomConfig.instance.put({ apiKey: 'set-key', commonBaseURL: 'https://api.tomtom.com' });
            await get(new URL('https://blah1234.com'), {});
            const init = fetchMock.mock.calls[0][1] as RequestInit;
            expect(init.credentials).toBeUndefined();
        });

        test('customServiceBaseURL with apiKey present: get omits credentials', async () => {
            const fetchMock = mockFetchResponse(200, { id: 'ok' });
            TomTomConfig.instance.put({ apiKey: 'set-key', commonBaseURL: 'https://my-backend.example' });
            await get(new URL('https://my-backend.example/search'), {});
            const init = fetchMock.mock.calls[0][1] as RequestInit;
            expect(init.credentials).toBeUndefined();
        });

        test('demo-BFF proxy mode (empty apiKey + non-default commonBaseURL): get includes credentials', async () => {
            const fetchMock = mockFetchResponse(200, { id: 'ok' });
            TomTomConfig.instance.put({ apiKey: '', commonBaseURL: 'https://demo-bff.example.com/api' });
            await get(new URL('https://demo-bff.example.com/api/search'), {});
            expect(fetchMock).toHaveBeenCalledWith(
                expect.any(URL),
                expect.objectContaining({ credentials: 'include' }),
            );
        });

        test('demo-BFF proxy mode with apiKey overwritten to undefined still includes credentials', async () => {
            // Reproduces the real bug: an example runs
            // `put({ apiKey: process.env.API_KEY_EXAMPLES })` with that env
            // unset, overwriting the bootstrap's `apiKey: ''` to undefined.
            // Must still be treated as proxy mode (falsy apiKey).
            const fetchMock = mockFetchResponse(200, { id: 'ok' });
            TomTomConfig.instance.put({ commonBaseURL: 'https://demo-bff.example.com/api' });
            TomTomConfig.instance.put({ apiKey: undefined as unknown as string });
            await get(new URL('https://demo-bff.example.com/api/search'), {});
            expect(fetchMock).toHaveBeenCalledWith(
                expect.any(URL),
                expect.objectContaining({ credentials: 'include' }),
            );
        });

        test('demo-BFF proxy mode: post includes credentials', async () => {
            const fetchMock = mockFetchResponse(200, { id: 'ok' });
            TomTomConfig.instance.put({ apiKey: '', commonBaseURL: 'https://demo-bff.example.com/api' });
            await post({ url: new URL('https://demo-bff.example.com/api/route') }, {});
            expect(fetchMock).toHaveBeenCalledWith(
                expect.any(URL),
                expect.objectContaining({ credentials: 'include' }),
            );
        });
    });

    describe('Tracking-ID header', () => {
        test('Set tracking-ID header per service', async () => {
            const fetchMock = mockFetchResponse(200, { summary: {}, results: [] });
            await geocode({ query: 'teakhout', trackingId: 'geocode-id' });
            expect(fetchMock).toHaveBeenCalledWith(
                expect.any(URL),
                expect.objectContaining({
                    headers: expect.objectContaining({ 'Tracking-ID': 'geocode-id' }),
                }),
            );
        });

        test('Set global and per service trackingId header', async () => {
            TomTomConfig.instance.put({ trackingId: 'global-id' });

            const fetchMock = mockFetchResponse(200, { summary: {}, results: [] });
            await geocode({ query: 'teakhout', trackingId: 'geocode-id' });
            expect(fetchMock).toHaveBeenCalledWith(
                expect.any(URL),
                expect.objectContaining({
                    headers: expect.objectContaining({ 'Tracking-ID': 'geocode-id' }),
                }),
            );

            await geocode({ query: 'cafe' });
            expect(fetchMock).toHaveBeenCalledWith(
                expect.any(URL),
                expect.objectContaining({
                    headers: expect.objectContaining({ 'Tracking-ID': 'global-id' }),
                }),
            );
        });
    });
});
