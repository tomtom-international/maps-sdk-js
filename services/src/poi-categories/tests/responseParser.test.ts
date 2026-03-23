import { describe, expect, test, vi } from 'vitest';
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

describe('POI categories response parser null handling', () => {
    test('logs an error for each unknown top-level category ID', () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        parsePoiCategoriesResponse({
            poiCategories: [
                { id: 99997, name: 'Unknown A', synonyms: [], childCategoryIds: [] },
                { id: 99998, name: 'Unknown B', synonyms: [], childCategoryIds: [] },
            ],
        });
        expect(errorSpy).toHaveBeenCalledTimes(2);
        expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('99997'));
        expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('99998'));
        errorSpy.mockRestore();
    });

    test('does not log an error for known category IDs', () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        parsePoiCategoriesResponse({
            poiCategories: [{ id: 7315, name: 'Restaurant', synonyms: [], childCategoryIds: [] }],
        });
        expect(errorSpy).not.toHaveBeenCalled();
        errorSpy.mockRestore();
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
