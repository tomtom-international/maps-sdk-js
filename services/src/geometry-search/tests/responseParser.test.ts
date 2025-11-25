import { describe, expect, test } from 'vitest';
import { bestExecutionTimeMS } from '../../../../core/src/util/tests/performanceTestUtils';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { parseGeometrySearchResponse } from '../responseParser';
import { GeometrySearchResponse, GeometrySearchResponseAPI } from '../types';
import { apiAndParsedResponses } from './responseParser.data';
import { apiResponses } from './responseParserPerf.data';

describe('Geometry Search response parser tests', () => {
    test.each(
        apiAndParsedResponses,
    )("'%s'", (_name: string, apiResponse: GeometrySearchResponseAPI, parsedResponse: GeometrySearchResponse) => {
        expect(parseGeometrySearchResponse(apiResponse)).toStrictEqual(parsedResponse);
    });
});

describe('Geometry Search response parser performance tests', () => {
    test.each(apiResponses)("'%s'", (_title: string, apiResponse: GeometrySearchResponseAPI) => {
        expect(bestExecutionTimeMS(() => parseGeometrySearchResponse(apiResponse), 10)).toBeLessThan(
            MAX_EXEC_TIMES_MS.search.geometrySearch.responseParsing,
        );
    });
});
