import { VehicleEngineType } from './vehicleEngineParams';

export type ChargingPreferencesPCT = {
    /**
     * The minimum battery % you wish to arrive at your destination with.
     * * Requires maxChargeKWH.
     * * Minimum: 0, maximum: 100.
     */
    minChargeAtDestinationPCT: number;
    /**
     * The minimum battery % you wish to arrive at each charging station with.
     * * However, the remaining charge at the first charging stop may be lower.
     * * Requires maxChargeKWH.
     * * Minimum: 0, maximum: 50.
     */
    minChargeAtChargingStopsPCT: number;
};

export type ChargingPreferencesKWH = {
    /**
     * The minimum battery kWh you wish to arrive at your destination with.
     * * Minimum: 0. Maximum: maxChargeKWH.
     */
    minChargeAtDestinationInkWh: number;
    /**
     * The minimum battery kWh you wish to arrive at each charging station with.
     * * However, the remaining charge at the first charging stop may be lower.
     * * Minimum: 0, maximum: half of maxChargeKWH.
     */
    minChargeAtChargingStopsInkWh: number;
};

/**
 * Charging preferences for Long Distance EV Routing.
 * * Specifying these preferences will trigger the calculation of charging stops along your route.
 * * Requires the ChargingModel to be set in consumption.charging.
 */
export type ChargingPreferences = ChargingPreferencesPCT | ChargingPreferencesKWH;

export type ElectricVehiclePreferences = {
    /**
     * Charging preferences for Long Distance EV Routing.
     * * Specifying these preferences will trigger the calculation of charging stops along your route.
     * * Requires the ElectricConsumptionModel to be set.
     * @see https://docs.tomtom.com/routing-api/documentation/extended-routing/long-distance-ev-routing
     */
    chargingPreferences?: ChargingPreferences;
};

export type VehiclePreferences<E extends VehicleEngineType = undefined> = E extends 'electric'
    ? ElectricVehiclePreferences
    : {};
