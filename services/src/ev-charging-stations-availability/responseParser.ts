import type { ChargingStationsAvailability } from "@anw/maps-sdk-js/core";
import { toChargingPointAvailability, toConnectorBasedAvailabilities } from "./connectorAvailability";
import type { ChargingStationsAvailabilityResponseAPI } from "./types/apiTypes";
import { parseOpeningHours } from "../shared/searchResultParsing";

/**
 * Default method for parsing ev charging stations availability from {@link ChargingStationsAvailability}
 * @param apiResponse
 */
export const parseEVChargingStationsAvailabilityResponse = (
    apiResponse: ChargingStationsAvailabilityResponseAPI
): ChargingStationsAvailability | undefined => {
    const result = apiResponse.results?.[0];
    return result
        ? {
              id: result.id,
              accessType: result.accessType,
              chargingStations: result.chargingStations,
              chargingPointAvailability: toChargingPointAvailability(result.chargingStations),
              connectorAvailabilities: toConnectorBasedAvailabilities(result.chargingStations),
              ...(result.openingHours && { openingHours: parseOpeningHours(result.openingHours) })
          }
        : undefined;
};
