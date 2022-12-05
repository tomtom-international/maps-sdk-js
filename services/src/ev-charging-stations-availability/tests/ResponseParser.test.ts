import apiAndParsedResponses from "./ResponseParser.data.json";
import { parseEVChargingStationsAvailabilityResponse } from "../ResponseParser";
import errorResponses from "../tests/ResponseError.data.json";
import { DefaultAPIResponseError, ErrorObjAPI } from "../../shared/types/APIResponseErrorTypes";
import { ServiceName } from "../../shared/types/ServicesTypes";
import { SDKServiceError } from "../../shared/Errors";
import { evChargingStationsAvailabilityResponseErrorParser } from "../EVChargingStationsAvailabilityResponseErrorParser";

describe("Charging availability response parsing tests", () => {
    test.each(apiAndParsedResponses)(
        `'%s`,
        // @ts-ignore
        (_name: string, apiResponse: ChargingAvailabilityResponse, sdkResponse: ChargingAvailabilityResponse) => {
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
            const sdkResponseError = evChargingStationsAvailabilityResponseErrorParser(apiResponseError, serviceName);
            expect(sdkResponseError).toBeInstanceOf(SDKServiceError);
            expect(sdkResponseError).toMatchObject(expectedSDKError);
        }
    );
});
