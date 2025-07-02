import apiAndParsedResponses from '../../place-by-id/tests/responseParser.data.json';
import apiResponseForPerfTesting from '../../place-by-id/tests/responseParserPerf.data.json';
import type { PlaceByIdResponse, PlaceByIdResponseAPI } from '../types';
import { parsePlaceByIdResponse } from '../responseParser';
import { bestExecutionTimeMS } from 'core/src/util/tests/performanceTestUtils';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';

describe('Place By Id response parser tests', () => {
    test.each(apiAndParsedResponses)(
        "'%s'",
        // @ts-ignore
        (_name: string, apiResponse: PlaceByIdResponseAPI, parsedResponse: PlaceByIdResponse) => {
            expect(parsePlaceByIdResponse(apiResponse)).toStrictEqual(parsedResponse);
        },
    );
});

describe('Place By Id response parser performance tests', () => {
    test('Place By Id response parser performance test', () => {
        expect(
            bestExecutionTimeMS(() => parsePlaceByIdResponse(apiResponseForPerfTesting as PlaceByIdResponseAPI), 3),
        ).toBeLessThan(MAX_EXEC_TIMES_MS.placeById.responseParsing);
    });
});
