import { VehicleEngineType } from './vehicleEngineParams';

export type CombustionVehicleState = {
    /**
     * Specifies the current supply of fuel in liters.
     *
     * Minimum value: 0
     */
    currentFuelInLiters: number;
};

export type ElectricVehicleStatePCT = {
    /**
     * Specifies the current battery charge in %.
     * * Note: Requires model.charging.maxChargeKWH to be set.
     * * Minimum: 0, maximum: 100.
     */
    currentChargePCT: number;
};

export type ElectricVehicleStateKWH = {
    /**
     * Specifies the current battery charge in KWH.
     * * Note: Needed if the maxChargeKWH is not set.
     * * Minimum: 0.
     */
    currentChargeInkWh: number;
};

export type ElectricVehicleState = ElectricVehicleStatePCT | ElectricVehicleStateKWH;

export type GenericVehicleState = {
    /**
     * The current heading at the starting point, in degrees starting at true North and continuing in a clockwise direction.
     * * North is 0 degrees.
     * * East is 90 degrees.
     * * South is 180 degrees.
     * * West is 270 degrees.
     *
     * Allowed values: 0-359
     */
    heading?: number;
};

export type VehicleState<E extends VehicleEngineType = undefined> = GenericVehicleState &
    (E extends 'combustion' ? CombustionVehicleState : E extends 'electric' ? ElectricVehicleState : {});
