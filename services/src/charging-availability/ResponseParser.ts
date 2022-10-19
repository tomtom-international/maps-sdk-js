/**
 * Default method for parsing charging availability from {@link ChargingAvailabilityResponse}
 * @group ChargingAvailability
 * @category Functions
 * @param apiResponse
 */
import { ChargingAvailabilityResponse } from "./types/ChargingAvailabilityResponse";

export const parseChargingAvailabilityResponse = (
    apiResponse: ChargingAvailabilityResponse
): ChargingAvailabilityResponse => {
    // Nothing to do for now, return it as-is
    return apiResponse;
};
