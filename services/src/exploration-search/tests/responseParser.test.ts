import { describe, expect, test } from 'vitest';
import { bestExecutionTimeMS } from '../../../../core/src/util/tests/performanceTestUtils';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { parseExplorationSearchResponse } from '../responseParser';
import type { ExplorationSearchParams, ExplorationSearchResponse, ExplorationSearchResponseAPI } from '../types';
import { apiAndParsedResponses } from './responseParser.data';

describe('Exploration Search response parser tests', () => {
    test.each(
        apiAndParsedResponses,
    )("'%s'", (_name: string, apiResponse: ExplorationSearchResponseAPI, params: ExplorationSearchParams, parsedResponse: ExplorationSearchResponse) => {
        expect(parseExplorationSearchResponse(apiResponse, params)).toStrictEqual(parsedResponse);
    });
});

describe('Exploration Search response parser performance tests', () => {
    test('Exploration Search response parser performance test', () => {
        // Reuse the heaviest scenario from the data table — full POI shape with area metadata.
        const heavyCase = apiAndParsedResponses[0];
        const [, apiResponse, params] = heavyCase;
        expect(bestExecutionTimeMS(() => parseExplorationSearchResponse(apiResponse, params), 10)).toBeLessThan(
            MAX_EXEC_TIMES_MS.search.explorationSearch.responseParsing,
        );
    });
});
