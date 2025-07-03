import type { Language } from '@anw/maps-sdk-js/core';
import { TomTomConfig } from '@anw/maps-sdk-js/core';
import autocompleteSearch from '../autocompleteSearch';
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
                id: expect.any(String),
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
const responseWithGeoBias = {
    context: {
        inputQuery: expect.any(String),
        geoBias: expect.objectContaining({
            position: expect.arrayContaining([expect.any(Number)]),
        }),
    },
    results: expectedResults,
};
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
            apiKey: process.env.API_KEY,
            language: process.env.LANGUAGE as Language,
        });
    });

    test('autocomplete call with required parameters', async () => {
        const query = 'cafe';
        const language = 'en-GB';
        const res = await autocompleteSearch({ query, language });
        expect(res).toEqual(basicResponse);
    });

    test('autocomplete with option parameters', async () => {
        const query = 'Indiaas restaurant';
        const position = [4.81875, 51.85335];
        const limit = 5;
        const countries = ['NL', 'FR'];
        const response = await autocompleteSearch({
            query,
            position,
            limit,
            countries,
        });

        expect(response.results.length).toBeLessThanOrEqual(limit);
        expect(response).toEqual(responseWithGeoBias);
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
        const onAPIRequest = jest.fn() as (request: URL) => void;
        const onAPIResponse = jest.fn() as (request: URL, response: AutocompleteSearchResponseAPI) => void;
        const query = 'cafe';
        const language = 'en-GB';
        const result = await autocompleteSearch({ query, language, onAPIRequest, onAPIResponse });
        expect(result).toEqual(basicResponse);
        expect(onAPIRequest).toHaveBeenCalledWith(expect.any(URL));
        expect(onAPIResponse).toHaveBeenCalledWith(expect.any(URL), expect.anything());
    });

    test('Autocomplete with API request and error response callbacks', async () => {
        const onAPIRequest = jest.fn() as (request: URL) => void;
        const onAPIResponse = jest.fn() as (request: URL, response: AutocompleteSearchResponseAPI) => void;
        const query = 'cafe';
        const language = 'INCORRECT' as never;
        await expect(() => autocompleteSearch({ query, language, onAPIRequest, onAPIResponse })).rejects.toThrow(
            expect.objectContaining({ status: 400 }),
        );
        expect(onAPIRequest).toHaveBeenCalledWith(expect.any(URL));
        expect(onAPIResponse).toHaveBeenCalledWith(expect.any(URL), expect.objectContaining({ status: 400 }));
    });
});
