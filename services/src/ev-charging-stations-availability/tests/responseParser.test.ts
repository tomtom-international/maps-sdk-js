import type { EVChargingStationsAvailability } from "@anw/maps-sdk-js/core";
import apiAndParsedResponses from "./responseParser.data.json";
import apiResponses from "./responseParserPerf.data.json";
import { parseEVChargingStationsAvailabilityResponse } from "../responseParser";
import errorResponses from "../tests/responseError.data.json";
import type { APIErrorResponse } from "../../shared/types/apiResponseErrorTypes";
import type { ServiceName } from "../../shared";
import { SDKServiceError } from "../../shared";
import { parseEVChargingStationsAvailabilityResponseError } from "../evChargingStationsAvailabilityResponseErrorParser";
import { bestExecutionTimeMS } from "core/src/util/tests/performanceTestUtils";
import { MAX_EXEC_TIMES_MS } from "../../shared/tests/perfConfig";

describe("Charging availability response parsing tests", () => {
    test.each(apiAndParsedResponses)(
        `'%s`,
        // @ts-ignore
        (_name: string, apiResponse: EVChargingStationsAvailability, sdkResponse: EVChargingStationsAvailability) => {
            expect(parseEVChargingStationsAvailabilityResponse(apiResponse)).toStrictEqual(sdkResponse);
        }
    );
});

describe("Charging availability error response parsing tests", () => {
    test.each(errorResponses)(
        "'%s'",
        // @ts-ignore
        (
            _name: string,
            apiResponseError: APIErrorResponse,
            serviceName: ServiceName,
            expectedSDKError: SDKServiceError
        ) => {
            const sdkResponseError = parseEVChargingStationsAvailabilityResponseError(apiResponseError, serviceName);
            expect(sdkResponseError).toBeInstanceOf(SDKServiceError);
            expect(sdkResponseError).toMatchObject(expectedSDKError);
        }
    );
});

describe("Charging availability response parsing performance tests", () => {
    test.each(apiResponses)(
        `'%s`,
        // @ts-ignore
        (_name: string, apiResponse: EVChargingStationsAvailability) => {
            expect(
                bestExecutionTimeMS(() => parseEVChargingStationsAvailabilityResponse(apiResponse), 10)
            ).toBeLessThan(MAX_EXEC_TIMES_MS.ev.responseParsing);
        }
    );
});
