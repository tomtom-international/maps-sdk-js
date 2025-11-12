import { describe, expect, test } from 'vitest';
import { bestExecutionTimeMS } from '../../../../core/src/util/tests/performanceTestUtils';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { parseAutocompleteSearchResponse } from '../responseParser';
import type { AutocompleteSearchResponse, AutocompleteSearchResponseAPI } from '../types';
import apiAndParsedResponses from './responseParser.data.json';
import apiResponses from './responseParserPerf.data.json';

describe('Autocomplete response parser tests', () => {
    test.each(apiAndParsedResponses)(
        "'%s'",
        // @ts-ignore
        (_name: string, apiResponse: AutocompleteSearchResponseAPI, parsedResponse: AutocompleteSearchResponse) => {
            expect(parseAutocompleteSearchResponse(apiResponse)).toStrictEqual(parsedResponse);
        },
    );
});

describe('Autocomplete response parser performance tests', () => {
    test.each(apiResponses)(
        "'%s'",
        // @ts-ignore
        (_title: string, apiResponse: AutocompleteSearchResponseAPI) => {
            expect(bestExecutionTimeMS(() => parseAutocompleteSearchResponse(apiResponse), 10)).toBeLessThan(
                MAX_EXEC_TIMES_MS.autocomplete.responseParsing,
            );
        },
    );
});
