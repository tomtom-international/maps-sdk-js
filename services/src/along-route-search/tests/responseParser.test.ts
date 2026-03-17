import { describe, expect, test } from 'vitest';
import { bestExecutionTimeMS } from '../../../../core/src/util/tests/performanceTestUtils';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { parseAlongRouteSearchResponse } from '../responseParser';
import type { AlongRouteSearchResponse, AlongRouteSearchResponseAPI } from '../types';
import { apiAndParsedResponses } from './responseParser.data';
import { apiResponses } from './responseParserPerf.data';

describe('Along Route Search response parser tests', () => {
    test.each(
        apiAndParsedResponses,
    )("'%s'", (_name: string, apiResponse: AlongRouteSearchResponseAPI, parsedResponse: AlongRouteSearchResponse) => {
        expect(parseAlongRouteSearchResponse(apiResponse)).toStrictEqual(parsedResponse);
    });
});

describe('Along Route Search response parser performance tests', () => {
    test.each(apiResponses)("'%s'", (_title: string, apiResponse: AlongRouteSearchResponseAPI) => {
        expect(bestExecutionTimeMS(() => parseAlongRouteSearchResponse(apiResponse), 10)).toBeLessThan(
            MAX_EXEC_TIMES_MS.search.alongRouteSearch.responseParsing,
        );
    });
});
