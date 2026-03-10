import { describe, expect, test } from 'vitest';
import { bestExecutionTimeMS } from '../../../../core/src/util/tests/performanceTestUtils';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { buildTextCache } from '../cache';
import { parsePoiCategoriesResponse } from '../responseParser';
import apiAndParsedResponses from './responseParser.data';
import realApiResponse from './responseParserPerf.data';

describe('POI categories response parser tests', () => {
    test.each(apiAndParsedResponses)("'%s'", (_name, apiResponse, parsedResponse) => {
        expect(parsePoiCategoriesResponse(apiResponse)).toStrictEqual(parsedResponse);
    });
});

describe('POI categories response parser performance tests', () => {
    test('response parser with real 543-category data', () => {
        expect(bestExecutionTimeMS(() => parsePoiCategoriesResponse(realApiResponse), 10)).toBeLessThan(
            MAX_EXEC_TIMES_MS.poiCategories.responseParsing,
        );
    });

    test('text index build with real 543-category data', () => {
        const { poiCategories: parsed } = parsePoiCategoriesResponse(realApiResponse);
        expect(bestExecutionTimeMS(() => buildTextCache(parsed), 10)).toBeLessThan(
            MAX_EXEC_TIMES_MS.poiCategories.wordIndexBuild,
        );
    });
});
