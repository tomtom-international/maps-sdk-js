import { VehicleEngineType } from './vehicleEngineParams';

/**
 * Charging preferences specified by battery percentage.
 *
 * @remarks
 * Requires `maxChargeKWH` to be set in the vehicle model.
 *
 * @example
 * ```typescript
 * const prefs: ChargingPreferencesPCT = {
 *   minChargeAtDestinationPCT: 20,
 *   minChargeAtChargingStopsPCT: 10
 * };
 * ```
 *
 * @group Vehicle
 * @category Types
 */
export type ChargingPreferencesPCT = {
    /**
     * The minimum battery percentage you wish to arrive at your destination with.
     *
     * @remarks
     * Requires `maxChargeKWH` to be set in the vehicle model.
     *
     * Ensures you don't arrive with critically low battery, providing a safety buffer.
     *
     * **Typical Values:**
     * - Conservative: 20-30% (safe buffer)
     * - Moderate: 10-20% (some buffer)
     * - Minimal: 5-10% (tight planning)
     *
     * Minimum: 0, Maximum: 100
     *
     * @example
     * ```typescript
     * minChargeAtDestinationPCT: 20  // Arrive with 20% battery
     * minChargeAtDestinationPCT: 15  // Moderate buffer
     * ```
     */
    minChargeAtDestinationPCT: number;

    /**
     * The minimum battery percentage you wish to arrive at each charging station with.
     *
     * @remarks
     * However, the remaining charge at the first charging stop may be lower.
     * Requires `maxChargeKWH` to be set in the vehicle model.
     *
     * Prevents deep discharge by ensuring you don't arrive at chargers with critically
     * low battery. This accounts for unexpected detours or charger unavailability.
     *
     * **Typical Values:**
     * - Conservative: 15-20%
     * - Moderate: 10-15%
     * - Minimal: 5-10%
     *
     * Minimum: 0, Maximum: 50
     *
     * @example
     * ```typescript
     * minChargeAtChargingStopsPCT: 10  // 10% buffer at each stop
     * minChargeAtChargingStopsPCT: 15  // Conservative buffer
     * ```
     */
    minChargeAtChargingStopsPCT: number;
};

/**
 * Charging preferences specified by absolute energy in kilowatt-hours.
 *
 * @remarks
 * Use when you prefer to specify energy buffers in kWh rather than percentages.
 *
 * @example
 * ```typescript
 * const prefs: ChargingPreferencesKWH = {
 *   minChargeAtDestinationInkWh: 15,
 *   minChargeAtChargingStopsInkWh: 10
 * };
 * ```
 *
 * @group Vehicle
 * @category Types
 */
export type ChargingPreferencesKWH = {
    /**
     * The minimum battery kWh you wish to arrive at your destination with.
     *
     * @remarks
     * **Typical Values (based on battery size):**
     * - Small EV (40 kWh): 5-10 kWh buffer
     * - Medium EV (75 kWh): 10-15 kWh buffer
     * - Large EV (100 kWh): 15-20 kWh buffer
     *
     * Minimum: 0, Maximum: `maxChargeKWH`
     *
     * @example
     * ```typescript
     * minChargeAtDestinationInkWh: 15  // 15 kWh remaining
     * minChargeAtDestinationInkWh: 10  // 10 kWh buffer
     * ```
     */
    minChargeAtDestinationInkWh: number;

    /**
     * The minimum battery kWh you wish to arrive at each charging station with.
     *
     * @remarks
     * However, the remaining charge at the first charging stop may be lower.
     *
     * **Typical Values:**
     * - Conservative: 15-20 kWh
     * - Moderate: 10-15 kWh
     * - Minimal: 5-10 kWh
     *
     * Minimum: 0, Maximum: half of `maxChargeKWH`
     *
     * @example
     * ```typescript
     * minChargeAtChargingStopsInkWh: 10  // 10 kWh at each stop
     * minChargeAtChargingStopsInkWh: 15  // Conservative buffer
     * ```
     */
    minChargeAtChargingStopsInkWh: number;
};

/**
 * Charging preferences for Long Distance EV Routing.
 *
 * @remarks
 * Specifying these preferences will trigger the calculation of charging stops along your route.
 * Requires the ChargingModel to be set in `consumption.charging`.
 *
 * **When to Use:**
 * - Long-distance EV trips beyond single-charge range
 * - Planning trips with charging station stops
 * - Ensuring adequate battery buffers
 * - Optimizing charging stop locations
 *
 * **Choose Format:**
 * - Use percentage when thinking in terms of battery %
 * - Use kWh when you prefer absolute energy values
 *
 * @see {@link https://docs.tomtom.com/routing-api/documentation/extended-routing/long-distance-ev-routing | Long Distance EV Routing Documentation}
 *
 * @example
 * ```typescript
 * // Percentage-based preferences
 * const pctPrefs: ChargingPreferences = {
 *   minChargeAtDestinationPCT: 20,
 *   minChargeAtChargingStopsPCT: 10
 * };
 *
 * // Energy-based preferences
 * const kwhPrefs: ChargingPreferences = {
 *   minChargeAtDestinationInkWh: 15,
 *   minChargeAtChargingStopsInkWh: 10
 * };
 * ```
 *
 * @group Vehicle
 * @category Types
 */
export type ChargingPreferences = ChargingPreferencesPCT | ChargingPreferencesKWH;

/**
 * Preferences specific to electric vehicles.
 *
 * @remarks
 * Contains EV-specific routing preferences, primarily for long-distance trips
 * with charging stops.
 *
 * @example
 * ```typescript
 * const evPrefs: ElectricVehiclePreferences = {
 *   chargingPreferences: {
 *     minChargeAtDestinationPCT: 20,
 *     minChargeAtChargingStopsPCT: 10
 *   }
 * };
 * ```
 *
 * @group Vehicle
 * @category Types
 */
export type ElectricVehiclePreferences = {
    /**
     * Charging preferences for Long Distance EV Routing.
     *
     * @remarks
     * Specifying these preferences will trigger the calculation of charging stops along your route.
     * Requires the ElectricConsumptionModel to be set.
     *
     * **When Charging Stops Are Added:**
     * - Route exceeds single-charge range
     * - Preferences ensure safe battery levels
     * - Optimal charger locations are found
     * - Charging time is minimized
     *
     * @see {@link https://docs.tomtom.com/routing-api/documentation/extended-routing/long-distance-ev-routing | Long Distance EV Routing}
     *
     * @example
     * ```typescript
     * chargingPreferences: {
     *   minChargeAtDestinationPCT: 20,
     *   minChargeAtChargingStopsPCT: 10
     * }
     * ```
     */
    chargingPreferences?: ChargingPreferences;
};

/**
 * Vehicle preferences - optional routing preferences based on engine type.
 *
 * @remarks
 * Currently only electric vehicles have specific preferences (charging stops).
 * Future versions may add preferences for combustion vehicles.
 *
 * @typeParam E - The engine type (combustion, electric, or undefined for generic)
 *
 * @example
 * ```typescript
 * // Electric vehicle with charging preferences
 * const evPrefs: VehiclePreferences<'electric'> = {
 *   chargingPreferences: {
 *     minChargeAtDestinationPCT: 20,
 *     minChargeAtChargingStopsPCT: 10
 *   }
 * };
 *
 * // Combustion or generic vehicle (no preferences)
 * const genericPrefs: VehiclePreferences = {};
 * ```
 *
 * @group Vehicle
 * @category Types
 */
export type VehiclePreferences<E extends VehicleEngineType = undefined> = E extends 'electric'
    ? ElectricVehiclePreferences
    : {};
