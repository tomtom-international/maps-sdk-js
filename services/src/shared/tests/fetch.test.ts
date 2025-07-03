import { TomTomConfig } from '@anw/maps-sdk-js/core';
import { geocode } from '../../geocode';
import { fetchWith, get, post } from '../fetch';
import { mockFetchResponse } from './fetchMockUtils';

describe('Fetch utility tests', () => {
    const unMockedFetch = global.fetch;
    afterAll(() => (global.fetch = unMockedFetch));

    describe('Get tests', () => {
        const headers = { 'TomTom-User-Agent': 'TEST/1' };

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
        const headers = { 'TomTom-User-Agent': 'TEST/1' };

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
        const headers = { 'TomTom-User-Agent': 'TEST/1' };

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
