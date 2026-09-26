import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import type { GetObject } from '../../shared/types/fetch';
import { autocompleteSearch } from '../autocompleteSearch';
import type {
    AutocompleteSearchResponse,
    AutocompleteSearchResponseAPI,
    AutocompleteSearchSegmentType,
} from '../types';

const expectedResults = expect.arrayContaining([
    expect.objectContaining({
        segments: expect.arrayContaining([
            expect.objectContaining({
                type: expect.any(String),
                value: expect.any(String),
            }),
        ]),
    }),
]);
const basicResponse = expect.objectContaining<AutocompleteSearchResponse>({
    context: {
        inputQuery: expect.any(String),
        geoBias: {},
    },
    results: expectedResults,
});
const responseWithGeoBias = expect.objectContaining({
    context: {
        inputQuery: expect.any(String),
        geoBias: expect.any(Object),
    },
    results: expectedResults,
});
const responseWithStrictBrandType = {
    context: {
        inputQuery: expect.any(String),
        geoBias: {},
    },
    results: expect.arrayContaining([
        expect.objectContaining({
            segments: expect.arrayContaining([
                expect.objectContaining({
                    type: 'brand',
                    value: expect.any(String),
                }),
            ]),
        }),
    ]),
};

describe('Autocomplete service', () => {
    beforeAll(() => {
        TomTomConfig.instance.put({
            apiKey: process.env.API_KEY_TESTS,
        });
    });

    beforeEach(async () => {
        // We enforce a delay before each test to avoid hitting the API rate limits.
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 2000));
    });

    test('autocomplete call with required parameters', async () => {
        const query = 'cafe';
        const language = 'en-GB';
        const res = await autocompleteSearch({ query, language });
        expect(res).toEqual(basicResponse);
    });

    test('autocomplete with option parameters', async () => {
        const query = 'Indian restaurant';
        const position = [4.81875, 51.85335];
        const limit = 5;
        const countries = ['NL', 'FR'];
        const response = await autocompleteSearch({
            query,
            geoBias: { position },
            limit,
            countries,
        });

        expect(response.results.length).toBeLessThanOrEqual(limit);
        expect(response).toMatchObject(responseWithGeoBias);
    });

    test('autocomplete with strict brand result type', async () => {
        const query = 'pizza';
        const language = 'en-GB';
        const resultType: AutocompleteSearchSegmentType[] = ['brand'];
        const response = await autocompleteSearch({
            query,
            language,
            resultType,
        });

        expect(response).toEqual(responseWithStrictBrandType);
    });

    test('Autocomplete with API request and response callbacks', async () => {
        const onApiRequest = vi.fn() as (request: GetObject) => void;
        const onApiResponse = vi.fn() as (request: GetObject, response: AutocompleteSearchResponseAPI) => void;
        const query = 'cafe';
        const language = 'en-GB';
        const result = await autocompleteSearch({
            query,
            language,
            onAPIRequest: onApiRequest,
            onAPIResponse: onApiResponse,
        });
        expect(result).toEqual(basicResponse);
        expect(onApiRequest).toHaveBeenCalledWith(expect.objectContaining({ url: expect.any(URL) }));
        expect(onApiResponse).toHaveBeenCalledWith(
            expect.objectContaining({ url: expect.any(URL) }),
            expect.anything(),
        );
    });

    test('Autocomplete with API request and error response callbacks', async () => {
        const onApiRequest = vi.fn() as (request: GetObject) => void;
        const onApiResponse = vi.fn() as (request: GetObject, response: AutocompleteSearchResponseAPI) => void;
        const query = 'cafe';
        // The service resolves `resultSet` against an enum, so an unknown segment type is always a
        // 400. An unknown `language` is not: the service ignores it and answers 200.
        const resultType = ['INCORRECT'] as never;
        await expect(() =>
            autocompleteSearch({ query, resultType, onAPIRequest: onApiRequest, onAPIResponse: onApiResponse }),
        ).rejects.toThrow(expect.objectContaining({ status: 400 }));
        expect(onApiRequest).toHaveBeenCalledWith(expect.objectContaining({ url: expect.any(URL) }));
        expect(onApiResponse).toHaveBeenCalledWith(
            expect.objectContaining({ url: expect.any(URL) }),
            expect.objectContaining({ status: 400 }),
        );
    });
});
