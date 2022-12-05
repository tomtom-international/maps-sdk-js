import { EVChargingStationsAvailabilityResponse } from "./types/EVChargingStationsAvailabilityResponse";

/**
 * Default method for parsing ev charging stations availability from {@link EVChargingStationsAvailabilityResponse}
 * @group EV Charging Stations Availability
 * @category Functions
 * @param apiResponse
 */
export const parseEVChargingStationsAvailabilityResponse = (
    apiResponse: EVChargingStationsAvailabilityResponse
): EVChargingStationsAvailabilityResponse => {
    // Nothing to do for now, return it as-is
    return apiResponse;
};
