import { bestExecutionTimeMS } from 'core/src/util/tests/performanceTestUtils';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { parseGeocodingResponse } from '../responseParser';
import type { GeocodingResponseAPI } from '../types/apiTypes';
import type { GeocodingResponse } from '../types/geocodingResponse';
import apiAndParsedResponses from './responseParser.data.json';
import geocodingAPIResponses from './responseParserPerf.data.json';

describe('Geocode response parsing tests', () => {
    test.each(apiAndParsedResponses)(
        `'%s`,
        // @ts-ignore
        (_name: string, apiResponse: GeocodingResponseAPI, sdkResponse: GeocodingResponse) => {
            expect(parseGeocodingResponse(apiResponse)).toStrictEqual(sdkResponse);
        },
    );
});

describe('Geocoding service response parser performance tests', () => {
    test.each(geocodingAPIResponses)(
        "'%s'",
        // @ts-ignore
        (apiResponse: GeocodingResponseAPI) => {
            expect(bestExecutionTimeMS(() => parseGeocodingResponse(apiResponse), 10)).toBeLessThan(
                MAX_EXEC_TIMES_MS.geocoding.responseParsing,
            );
        },
    );
});
