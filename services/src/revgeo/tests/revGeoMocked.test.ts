import { omit } from 'lodash-es';
import { afterAll, describe, expect, test } from 'vitest';
import { mockFetchResponse } from '../../shared/tests/fetchMockUtils';
import reverseGeocode from '../reverseGeocoding';
import type { ReverseGeocodingParams } from '../types/reverseGeocodingParams';
import apiAndParsedResponses from './revGeoMocked.data.json';

describe('Reverse Geocoding mock tests', () => {
    const unMockedFetch = global.fetch;
    afterAll(() => (global.fetch = unMockedFetch));

    test.each(apiAndParsedResponses)(
        `'%s`,
        // @ts-ignore
        async (_name: string, params: ReverseGeocodingParams, apiResponse: never, expectedParsedResponse: never) => {
            mockFetchResponse(200, apiResponse);
            const response = await reverseGeocode(params);
            expect(omit(response, 'id')).toEqual(expectedParsedResponse);
            // (IDs are to be generated at random)
            expect(response.id).toEqual(expect.any(String));
        },
    );

    test('Server response with 429.', async () => {
        mockFetchResponse(429);
        await expect(reverseGeocode({ position: [180, 90] })).rejects.toMatchObject({
            service: 'ReverseGeocode',
            status: 429,
        });
    });
});
