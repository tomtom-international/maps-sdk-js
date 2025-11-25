import { describe, expect, test } from 'vitest';
import { bestExecutionTimeMS } from '../../../../core/src/util/tests/performanceTestUtils';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { parseFuzzySearchResponse } from '../responseParser';
import { apiAndParsedResponses } from './responseParser.data';
import { apiResponses } from './responseParserPerf.data';

describe('Fuzzy Search response parser tests', () => {
    test.each(apiAndParsedResponses)("'%s'", (_name, apiResponse, parsedResponse) => {
        expect(parseFuzzySearchResponse(apiResponse)).toStrictEqual(parsedResponse);
    });
});

describe('Fuzzy Search response parser performance tests', () => {
    test.each(apiResponses)("'%s'", (_title, apiResponse) => {
        expect(bestExecutionTimeMS(() => parseFuzzySearchResponse(apiResponse), 10)).toBeLessThan(
            MAX_EXEC_TIMES_MS.search.fuzzySearch.responseParsing,
        );
    });
});
