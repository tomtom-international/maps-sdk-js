import { ChargingAvailabilityResponse } from "./types/ChargingAvailabilityResponse";

/**
 * Default method for parsing charging availability from {@link ChargingAvailabilityResponse}
 * @group Charging Availability
 * @category Functions
 * @param apiResponse
 */
export const parseChargingAvailabilityResponse = (
    apiResponse: ChargingAvailabilityResponse
): ChargingAvailabilityResponse => {
    // Nothing to do for now, return it as-is
    return apiResponse;
};
