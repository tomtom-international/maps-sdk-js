import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { omit } from 'lodash-es';
import { afterAll, afterEach, describe, expect, test } from 'vitest';
import { mockFetchResponse } from '../../shared/tests/fetchMockUtils';
import { reverseGeocode } from '../reverseGeocoding';
import apiAndParsedResponses from './revGeoMocked.data';

describe('Reverse Geocoding mock tests', () => {
    const unMockedFetch = globalThis.fetch;
    afterAll(() => (globalThis.fetch = unMockedFetch));
    afterEach(() => TomTomConfig.instance.reset());

    test.each(apiAndParsedResponses)(`'%s`, async (_name, params, apiResponse, expectedParsedResponse) => {
        mockFetchResponse(200, apiResponse);
        const response = await reverseGeocode(params);
        expect(omit(response, 'id')).toEqual(expectedParsedResponse);
        // (IDs are to be generated at random)
        expect(response.id).toEqual(expect.any(String));
    });

    test('Server response with 429.', async () => {
        TomTomConfig.instance.put({ retry: undefined });
        mockFetchResponse(429);
        await expect(reverseGeocode({ position: [180, 90] })).rejects.toMatchObject({
            service: 'ReverseGeocode',
            status: 429,
        });
    });
});
