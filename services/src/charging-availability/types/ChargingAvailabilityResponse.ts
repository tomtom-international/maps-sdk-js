import { ChargingStation } from "@anw/go-sdk-js/core";

/**
 * @group ChargingAvailability
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
