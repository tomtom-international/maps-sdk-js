import { VehicleEngineType } from './vehicleEngineParams';

/**
 * State properties for combustion engine vehicles.
 *
 * @remarks
 * Tracks fuel level for consumption calculations and range predictions.
 *
 * @example
 * ```typescript
 * const state: CombustionVehicleState = {
 *   currentFuelInLiters: 45  // Half tank of a 90L tank
 * };
 * ```
 *
 * @group Vehicle
 */
export type CombustionVehicleState = {
    /**
     * Specifies the current supply of fuel in liters.
     *
     * @remarks
     * Used to:
     * - Calculate remaining range
     * - Determine if refueling is needed
     * - Optimize routes based on available fuel
     *
     * **Typical Tank Sizes:**
     * - Small car: 40-50 liters
     * - SUV: 60-80 liters
     * - Truck: 200-500 liters
     *
     * Minimum value: 0
     *
     * @example
     * ```typescript
     * currentFuelInLiters: 50   // 50 liters remaining
     * currentFuelInLiters: 200  // Truck with 200 liters
     * ```
     */
    currentFuelInLiters: number;
};

/**
 * Electric vehicle state specified by battery percentage.
 *
 * @remarks
 * Requires `maxChargeKWH` to be set in the vehicle model for conversion
 * to actual energy values.
 *
 * @example
 * ```typescript
 * const state: ElectricVehicleStatePCT = {
 *   currentChargePCT: 75  // 75% battery remaining
 * };
 * ```
 *
 * @group Vehicle
 */
export type ElectricVehicleStatePCT = {
    /**
     * Specifies the current battery charge in percentage.
     *
     * @remarks
     * Note: Requires `model.charging.maxChargeKWH` to be set for proper
     * range calculations.
     *
     * **Minimum:** 0 (empty battery)
     * **Maximum:** 100 (fully charged)
     *
     * @example
     * ```typescript
     * currentChargePCT: 80   // 80% charged
     * currentChargePCT: 20   // 20% charged (low battery)
     * currentChargePCT: 100  // Fully charged
     * ```
     */
    currentChargePCT: number;
};

/**
 * Electric vehicle state specified by absolute energy in kilowatt-hours.
 *
 * @remarks
 * Use this when you know the exact energy remaining without needing
 * to specify the maximum battery capacity.
 *
 * @example
 * ```typescript
 * const state: ElectricVehicleStateKWH = {
 *   currentChargeInkWh: 60  // 60 kWh remaining
 * };
 * ```
 *
 * @group Vehicle
 */
export type ElectricVehicleStateKWH = {
    /**
     * Specifies the current battery charge in kWh.
     *
     * @remarks
     * Note: Needed if the `maxChargeKWH` is not set in the model.
     *
     * **Typical Battery Sizes:**
     * - Small EV: 30-40 kWh
     * - Mid-size EV: 60-75 kWh
     * - Large EV: 80-100+ kWh
     * - Electric truck: 150-200+ kWh
     *
     * Minimum: 0
     *
     * @example
     * ```typescript
     * currentChargeInkWh: 60   // 60 kWh remaining
     * currentChargeInkWh: 15   // Low battery (15 kWh)
     * ```
     */
    currentChargeInkWh: number;
};

/**
 * Electric vehicle state - either percentage or absolute energy.
 *
 * @remarks
 * Choose the format that matches your data source:
 * - Use percentage when you have battery % and max capacity
 * - Use kWh when you have absolute energy values
 *
 * @example
 * ```typescript
 * // Percentage format
 * const pctState: ElectricVehicleState = {
 *   currentChargePCT: 75
 * };
 *
 * // Energy format
 * const kwhState: ElectricVehicleState = {
 *   currentChargeInkWh: 60
 * };
 * ```
 *
 * @group Vehicle
 */
export type ElectricVehicleState = ElectricVehicleStatePCT | ElectricVehicleStateKWH;

/**
 * Generic vehicle state properties applicable to all vehicle types.
 *
 * @remarks
 * Contains state information that doesn't depend on the engine type.
 *
 * @example
 * ```typescript
 * const state: GenericVehicleState = {
 *   heading: 45  // Heading northeast
 * };
 * ```
 *
 * @group Vehicle
 */
export type GenericVehicleState = {
    /**
     * The current heading at the starting point, in degrees starting at true North and continuing in a clockwise direction.
     *
     * @remarks
     * **Bearing Reference:**
     * - North is 0 degrees
     * - East is 90 degrees
     * - South is 180 degrees
     * - West is 270 degrees
     *
     * Used to improve initial route calculation by considering the vehicle's
     * current direction of travel.
     *
     * Allowed values: 0-359
     *
     * @example
     * ```typescript
     * heading: 0    // Facing north
     * heading: 90   // Facing east
     * heading: 180  // Facing south
     * heading: 270  // Facing west
     * heading: 45   // Facing northeast
     * ```
     */
    heading?: number;
};

/**
 * Vehicle state - current conditions that change during travel.
 *
 * @remarks
 * Represents dynamic properties that vary during a journey:
 * - Fuel or battery level
 * - Current heading/direction
 *
 * Unlike the vehicle model (static properties), state changes as the
 * vehicle travels and consumes fuel/energy.
 *
 * @typeParam E - The engine type (combustion, electric, or undefined for generic)
 *
 * @example
 * ```typescript
 * // Generic vehicle with heading
 * const genericState: VehicleState = {
 *   heading: 90  // Facing east
 * };
 *
 * // Combustion vehicle with fuel
 * const combustionState: VehicleState<'combustion'> = {
 *   currentFuelInLiters: 45,
 *   heading: 180
 * };
 *
 * // Electric vehicle with battery percentage
 * const evState: VehicleState<'electric'> = {
 *   currentChargePCT: 75,
 *   heading: 0
 * };
 *
 * // Electric vehicle with absolute energy
 * const evKwhState: VehicleState<'electric'> = {
 *   currentChargeInkWh: 60,
 *   heading: 45
 * };
 * ```
 *
 * @group Vehicle
 */
export type VehicleState<E extends VehicleEngineType = undefined> = GenericVehicleState &
    (E extends 'combustion' ? CombustionVehicleState : E extends 'electric' ? ElectricVehicleState : {});
