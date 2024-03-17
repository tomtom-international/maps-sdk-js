import type { EVChargingStationsAvailability } from "@anw/maps-sdk-js/core";
import { toChargingPointAvailability, toConnectorBasedAvailabilities } from "./connectorAvailability";

/**
 * Default method for parsing ev charging stations availability from {@link EVChargingStationsAvailability}
 * @param apiResponse
 */
export const parseEVChargingStationsAvailabilityResponse = (
    apiResponse: EVChargingStationsAvailability
): EVChargingStationsAvailability => ({
    ...apiResponse,
    chargingPointAvailability: toChargingPointAvailability(apiResponse.chargingStations),
    connectorAvailabilities: toConnectorBasedAvailabilities(apiResponse.chargingStations)
});
