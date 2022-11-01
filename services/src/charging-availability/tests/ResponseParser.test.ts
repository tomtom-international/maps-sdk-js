import apiAndParsedResponses from "./ResponseParser.data.json";
import { parseChargingAvailabilityResponse } from "../ResponseParser";
import { ChargingAvailabilityResponse } from "../types/ChargingAvailabilityResponse";
import errorResponses from "../../charging-availability/tests/ResponseError.data.json";
import { DefaultAPIResponseError, ErrorObjAPI } from "../../shared/types/APIResponseErrorTypes";
import { ServiceName } from "../../shared/types/ServicesTypes";
import { SDKServiceError } from "../../shared/Errors";
import { chargingAvailabilityResponseErrorParser } from "../ChargingAvailabilityResponseErrorParser";

describe("Charging availability response parsing tests", () => {
    test.each(apiAndParsedResponses)(
        `'%s`,
        // @ts-ignore
        (_name: string, apiResponse: ChargingAvailabilityResponse, sdkResponse: ChargingAvailabilityResponse) => {
            expect(parseChargingAvailabilityResponse(apiResponse)).toStrictEqual(sdkResponse);
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
            const sdkResponseError = chargingAvailabilityResponseErrorParser(apiResponseError, serviceName);
            expect(sdkResponseError).toBeInstanceOf(SDKServiceError);
            expect(sdkResponseError).toMatchObject(expectedSDKError);
        }
    );
});
