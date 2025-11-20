import { describe, expect, test } from 'vitest';
import { bestExecutionTimeMS } from '../../../../core/src/util/tests/performanceTestUtils';
import apiAndParsedResponses from '../../geometry-search/tests/responseParser.data.json';
import apiResponses from '../../geometry-search/tests/responseParserPerf.data.json';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { parseGeometrySearchResponse } from '../responseParser';
import type { GeometrySearchResponse, GeometrySearchResponseAPI } from '../types';

describe('Geometry Search response parser tests', () => {
    test.each(
        apiAndParsedResponses,
    )("'%s'", (_name: string, apiResponse: GeometrySearchResponseAPI, parsedResponse: GeometrySearchResponse) => {
        // @ts-ignore
        expect(parseGeometrySearchResponse(apiResponse)).toStrictEqual(parsedResponse);
    });
});

describe('Geometry Search response parser performance tests', () => {
    test.each(apiResponses)("'%s'", (_title: string, apiResponse: GeometrySearchResponseAPI) => {
        // @ts-ignore
        expect(bestExecutionTimeMS(() => parseGeometrySearchResponse(apiResponse), 10)).toBeLessThan(
            MAX_EXEC_TIMES_MS.search.geometrySearch.responseParsing,
        );
    });
});
