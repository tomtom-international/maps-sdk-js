import { describe, expect, test } from 'vitest';
import { bestExecutionTimeMS } from '../../../../core/src/util/tests/performanceTestUtils';
import { SDKServiceError } from '../../shared';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { parseEVChargingStationsAvailabilityResponseError } from '../evChargingStationsAvailabilityResponseErrorParser';
import { parseEVChargingStationsAvailabilityResponse } from '../responseParser';
import { errorResponses } from './responseError.data';
import { apiAndParsedResponses } from './responseParser.data';
import { apiResponses } from './responseParserPerf.data';

describe('Charging availability response parsing tests', () => {
    test.each(apiAndParsedResponses)(`'%s`, (_name, apiResponse, sdkResponse) => {
        // (We use JSON.stringify because of the relation between JSON inputs and Date objects)
        // (We reparse the objects to compare them ignoring the order of properties)
        expect(parseEVChargingStationsAvailabilityResponse(apiResponse)).toMatchObject(sdkResponse);
    });

    test('Should return undefined when the API response is empty', () => {
        expect(
            parseEVChargingStationsAvailabilityResponse({ summary: { numResults: 0, offset: 0, totalResults: 0 } }),
        ).toBeUndefined();
        expect(
            parseEVChargingStationsAvailabilityResponse({
                summary: { numResults: 0, offset: 0, totalResults: 0 },
                results: [],
            }),
        ).toBeUndefined();
    });
});

describe('Charging availability error response parsing tests', () => {
    test.each(errorResponses)("'%s'", (_name, apiResponseError, serviceName, expectedSdkError) => {
        const sdkResponseError = parseEVChargingStationsAvailabilityResponseError(apiResponseError, serviceName);
        expect(sdkResponseError).toBeInstanceOf(SDKServiceError);
        expect(sdkResponseError).toMatchObject(expectedSdkError);
    });
});

describe('Charging availability response parsing performance tests', () => {
    test.each(apiResponses)(`'%s`, (_name, apiResponse) => {
        expect(bestExecutionTimeMS(() => parseEVChargingStationsAvailabilityResponse(apiResponse), 10)).toBeLessThan(
            MAX_EXEC_TIMES_MS.ev.responseParsing,
        );
    });
});
