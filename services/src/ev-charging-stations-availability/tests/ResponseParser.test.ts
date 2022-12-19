import apiAndParsedResponses from "./ResponseParser.data.json";
import { parseEVChargingStationsAvailabilityResponse } from "../ResponseParser";
import errorResponses from "../tests/ResponseError.data.json";
import { DefaultAPIResponseError, ErrorObjAPI } from "../../shared/types/APIResponseErrorTypes";
import { ServiceName } from "../../shared/types/ServicesTypes";
import { SDKServiceError } from "../../shared/Errors";
import { parseEVChargingStationsAvailabilityResponseError } from "../EVChargingStationsAvailabilityResponseErrorParser";
import { bestExecutionTimeMS } from "core/src/util/tests/PerformanceTestUtils";
import { EVChargingStationsAvailabilityResponse } from "../types/EVChargingStationsAvailabilityResponse";

describe("Charging availability response parsing tests", () => {
    test.each(apiAndParsedResponses)(
        `'%s`,
        // @ts-ignore
        (
            _name: string,
            apiResponse: EVChargingStationsAvailabilityResponse,
            sdkResponse: EVChargingStationsAvailabilityResponse
        ) => {
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
    test.each(apiAndParsedResponses)(
        `'%s`,
        // @ts-ignore
        (_name: string, apiResponse: EVChargingStationsAvailabilityResponse) => {
            expect(
                bestExecutionTimeMS(() => parseEVChargingStationsAvailabilityResponse(apiResponse), 10)
            ).toBeLessThan(2);
        }
    );
});
