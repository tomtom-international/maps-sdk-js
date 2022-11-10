import { ChargingStation } from "@anw/go-sdk-js/core";

/**
 * @group Charging Availability
 * @category Types
 */
export type ChargingAvailabilityResponse = {
    /**
     * The ID of the returned entity.
     */
    chargingParkId: string;
    /**
     * Array of chargingStation objects.
     */
    chargingStations: ChargingStation[];
};
