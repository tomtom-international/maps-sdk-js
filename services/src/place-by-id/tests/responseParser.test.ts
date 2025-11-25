import { describe, expect, test } from 'vitest';
import { bestExecutionTimeMS } from '../../../../core/src/util/tests/performanceTestUtils';
import apiAndParsedResponses from '../../place-by-id/tests/responseParser.data';
import apiResponseForPerfTesting from '../../place-by-id/tests/responseParserPerf.data';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { parsePlaceByIdResponse } from '../responseParser';
import type { PlaceByIdResponseAPI } from '../types';

describe('Place By Id response parser tests', () => {
    test.each(apiAndParsedResponses)("'%s'", (_name, apiResponse, parsedResponse) => {
        expect(parsePlaceByIdResponse(apiResponse)).toStrictEqual(parsedResponse);
    });
});

describe('Place By Id response parser performance tests', () => {
    test('Place By Id response parser performance test', () => {
        expect(
            bestExecutionTimeMS(() => parsePlaceByIdResponse(apiResponseForPerfTesting as PlaceByIdResponseAPI), 3),
        ).toBeLessThan(MAX_EXEC_TIMES_MS.placeById.responseParsing);
    });
});
