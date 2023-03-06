import { ChargingStation } from "@anw/go-sdk-js/core";

export type EVChargingStationsAvailabilityResponse = {
    /**
     * The ID of the returned entity.
     */
    chargingParkId: string;
    /**
     * Array of chargingStation objects.
     */
    chargingStations: ChargingStation[];
};
