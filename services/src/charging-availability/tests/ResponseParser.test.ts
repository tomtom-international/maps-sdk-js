import apiAndParsedResponses from "./ResponseParser.data.json";
import { parseChargingAvailabilityResponse } from "../ResponseParser";
import { ChargingAvailabilityResponse } from "../types/ChargingAvailabilityResponse";

describe("Charging availability response parsing tests", () => {
    test.each(apiAndParsedResponses)(
        `'%s`,
        // @ts-ignore
        (_name: string, apiResponse: ChargingAvailabilityResponse, sdkResponse: ChargingAvailabilityResponse) => {
            expect(parseChargingAvailabilityResponse(apiResponse)).toStrictEqual(sdkResponse);
        }
    );
});
