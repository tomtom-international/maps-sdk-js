import { describe, expect, test } from 'vitest';
import { bestExecutionTimeMS } from '../../../../core/src/util/tests/performanceTestUtils';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { parseFuzzySearchResponse } from '../responseParser';
import type { FuzzySearchResponse, FuzzySearchResponseAPI } from '../types';
import apiAndParsedResponses from './responseParser.data.json';
import apiResponses from './responseParserPerf.data.json';

describe('Fuzzy Search response parser tests', () => {
    test.each(
        apiAndParsedResponses,
    )("'%s'", (_name: string, apiResponse: FuzzySearchResponseAPI, parsedResponse: FuzzySearchResponse) => {
        // @ts-ignore
        expect(parseFuzzySearchResponse(apiResponse)).toStrictEqual(parsedResponse);
    });
});

describe('Fuzzy Search response parser performance tests', () => {
    test.each(apiResponses)("'%s'", (_title: string, apiResponse: FuzzySearchResponseAPI) => {
        // @ts-ignore
        expect(bestExecutionTimeMS(() => parseFuzzySearchResponse(apiResponse), 10)).toBeLessThan(
            MAX_EXEC_TIMES_MS.search.fuzzySearch.responseParsing,
        );
    });
});
