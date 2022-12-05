import { ChargingStation } from "@anw/go-sdk-js/core";

/**
 * @group EV Charging Stations Availability
 * @category Types
 */
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
