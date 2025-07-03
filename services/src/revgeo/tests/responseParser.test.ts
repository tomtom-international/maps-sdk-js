import { bestExecutionTimeMS } from 'core/src/util/tests/performanceTestUtils';
import omit from 'lodash/omit';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { parseRevGeoResponse } from '../responseParser';
import type { ReverseGeocodingResponse } from '../reverseGeocoding';
import type { ReverseGeocodingResponseAPI } from '../types/apiTypes';
import type { ReverseGeocodingParams } from '../types/reverseGeocodingParams';
import apiAndParsedResponses from './responseParser.data.json';
import apiResponses from './responseParserPerf.data.json';

describe('ReverseGeocode response parsing tests', () => {
    test.each(apiAndParsedResponses)(
        "'%s'",
        // @ts-ignore
        (
            _name: string,
            params: ReverseGeocodingParams,
            apiResponse: ReverseGeocodingResponseAPI,
            expectedParsedResponse: ReverseGeocodingResponse,
        ) => {
            const response = parseRevGeoResponse(apiResponse, params);
            expect(omit(response, 'id')).toStrictEqual(expectedParsedResponse);
            // (IDs are to be generated at random)
            expect(response.id).toBeTruthy();
            expect(response.id).toEqual(expect.any(String));
        },
    );
});

describe('ReverseGeocode response parsing performance tests', () => {
    test.each(apiResponses)(
        "'%s'",
        // @ts-ignore
        (_title: string, params: ReverseGeocodingParams, apiResponse: ReverseGeocodingResponseAPI) => {
            expect(bestExecutionTimeMS(() => parseRevGeoResponse(apiResponse, params), 10)).toBeLessThan(
                MAX_EXEC_TIMES_MS.revGeo.responseParsing,
            );
        },
    );
});
