import { EVChargingStationsAvailability } from "@anw/maps-sdk-js/core";
import apiAndParsedResponses from "./ResponseParser.data.json";
import apiResponses from "./ResponseParserPerf.data.json";
import { parseEVChargingStationsAvailabilityResponse } from "../ResponseParser";
import errorResponses from "../tests/ResponseError.data.json";
import { DefaultAPIResponseError, ErrorObjAPI } from "../../shared/types/APIResponseErrorTypes";
import { SDKServiceError, ServiceName } from "../../shared";
import { parseEVChargingStationsAvailabilityResponseError } from "../EVChargingStationsAvailabilityResponseErrorParser";
import { bestExecutionTimeMS } from "core/src/util/tests/PerformanceTestUtils";
import { MAX_EXEC_TIMES_MS } from "services/perfConfig";

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
            apiResponseError: ErrorObjAPI<DefaultAPIResponseError>,
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
