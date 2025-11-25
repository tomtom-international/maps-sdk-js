import { describe, expect, test } from 'vitest';
import { bestExecutionTimeMS } from '../../../../core/src/util/tests/performanceTestUtils';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { parseGeocodingResponse } from '../responseParser';
import apiAndParsedResponses from './responseParser.data';
import geocodingApiResponses from './responseParserPerf.data';

describe('Geocode response parsing tests', () => {
    test.each(apiAndParsedResponses)(`'%s`, (_name, apiResponse, sdkResponse) => {
        expect(parseGeocodingResponse(apiResponse)).toStrictEqual(sdkResponse);
    });
});

describe('Geocoding service response parser performance tests', () => {
    test.each(geocodingApiResponses)("'%s'", (apiResponse) => {
        expect(bestExecutionTimeMS(() => parseGeocodingResponse(apiResponse), 10)).toBeLessThan(
            MAX_EXEC_TIMES_MS.geocoding.responseParsing,
        );
    });
});
