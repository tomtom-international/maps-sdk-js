import type { ChargingStationsAvailability } from '@anw/maps-sdk-js/core';
import { bestExecutionTimeMS } from 'core/src/util/tests/performanceTestUtils';
import type { ServiceName } from '../../shared';
import { SDKServiceError } from '../../shared';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import type { APIErrorResponse } from '../../shared/types/apiResponseErrorTypes';
import { parseEVChargingStationsAvailabilityResponseError } from '../evChargingStationsAvailabilityResponseErrorParser';
import { parseEVChargingStationsAvailabilityResponse } from '../responseParser';
import errorResponses from '../tests/responseError.data.json';
import type { ChargingStationsAvailabilityResponseAPI } from '../types/apiTypes';
import apiAndParsedResponses from './responseParser.data.json';
import apiResponses from './responseParserPerf.data.json';

describe('Charging availability response parsing tests', () => {
    test.each(apiAndParsedResponses)(
        `'%s`,
        // @ts-ignore
        (
            _name: string,
            apiResponse: ChargingStationsAvailabilityResponseAPI,
            sdkResponse: ChargingStationsAvailability,
        ) => {
            // (We use JSON.stringify because of the relation between JSON inputs and Date objects)
            // (We reparse the objects to compare them ignoring the order of properties)
            expect(parseEVChargingStationsAvailabilityResponse(apiResponse)).toMatchObject(sdkResponse);
        },
    );

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
    test.each(errorResponses)(
        "'%s'",
        // @ts-ignore
        (
            _name: string,
            apiResponseError: APIErrorResponse,
            serviceName: ServiceName,
            expectedSDKError: SDKServiceError,
        ) => {
            const sdkResponseError = parseEVChargingStationsAvailabilityResponseError(apiResponseError, serviceName);
            expect(sdkResponseError).toBeInstanceOf(SDKServiceError);
            expect(sdkResponseError).toMatchObject(expectedSDKError);
        },
    );
});

describe('Charging availability response parsing performance tests', () => {
    test.each(apiResponses)(
        `'%s`,
        // @ts-ignore
        (_name: string, apiResponse: ChargingStationsAvailabilityResponseAPI) => {
            expect(
                bestExecutionTimeMS(() => parseEVChargingStationsAvailabilityResponse(apiResponse), 10),
            ).toBeLessThan(MAX_EXEC_TIMES_MS.ev.responseParsing);
        },
    );
});
