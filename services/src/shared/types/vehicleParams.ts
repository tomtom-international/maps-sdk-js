import { VehicleModel } from './vehicleModel';
import { VehiclePreferences } from './vehiclePreferences';
import { VehicleRestrictions } from './vehicleRestrictionParams';
import { VehicleState } from './vehicleState';

/**
 * Generic vehicle parameters without specific engine type.
 *
 * @remarks
 * Use for vehicles where engine type doesn't matter for routing,
 * or when you want to specify only basic restrictions.
 *
 * @example
 * ```typescript
 * const params: GenericVehicleParams = {
 *   model: {
 *     dimensions: {
 *       heightMeters: 2.5,
 *       weightKG: 3500
 *     }
 *   }
 * };
 * ```
 *
 * @group Vehicle
 */
export type GenericVehicleParams = {
    /**
     * Model (static properties) of the vehicle with generic/unspecified engine type.
     *
     * @remarks
     * Includes dimensions and other characteristics that don't change during travel.
     */
    model?: VehicleModel;

    /**
     * State of the vehicle with generic/unspecified engine type.
     *
     * @remarks
     * Includes current heading and other properties that vary during travel.
     */
    state?: VehicleState;

    /**
     * Generic vehicle preferences for unspecified engine type.
     *
     * @remarks
     * Currently no generic preferences exist; this is for future extensibility.
     */
    preferences?: VehiclePreferences;
};

/**
 * Parameters specific to combustion engine vehicles.
 *
 * @remarks
 * Use for petrol, diesel, or other fuel-powered vehicles when you need
 * accurate fuel consumption and range calculations.
 *
 * @example
 * ```typescript
 * const params: CombustionVehicleParams = {
 *   engineType: 'combustion',
 *   model: {
 *     dimensions: {
 *       weightKG: 1500
 *     },
 *     engine: {
 *       consumption: {
 *         fuelEnergyDensityInMJoulesPerLiter: 34.2,
 *         speedToConsumption: [
 *           { speedKMH: 50, consumptionUnitsPer100KM: 6.5 },
 *           { speedKMH: 90, consumptionUnitsPer100KM: 7.2 },
 *           { speedKMH: 120, consumptionUnitsPer100KM: 9.0 }
 *         ]
 *       }
 *     }
 *   },
 *   state: {
 *     currentFuelInLiters: 45
 *   }
 * };
 * ```
 *
 * @group Vehicle
 */
export type CombustionVehicleParams = {
    /**
     * Combustion vehicles.
     *
     * @remarks
     * Identifies this as a fuel-powered vehicle (petrol, diesel, etc.).
     */
    engineType: 'combustion';

    /**
     * Model (static properties) specifically for combustion engine vehicles.
     *
     * @remarks
     * Can include fuel consumption curves and efficiency parameters.
     */
    model?: VehicleModel<'combustion'>;

    /**
     * State specifically for combustion engine vehicles.
     *
     * @remarks
     * Must include current fuel level for range calculations.
     */
    state?: VehicleState<'combustion'>;

    /**
     * Preferences specifically for combustion engine vehicles.
     *
     * @remarks
     * Currently no combustion-specific preferences; reserved for future features.
     */
    preferences?: VehiclePreferences<'combustion'>;
};

/**
 * Parameters specific to electric vehicles (EVs).
 *
 * @remarks
 * Use for battery electric vehicles when you need accurate range predictions,
 * charging stop calculations, and EV-specific routing.
 *
 * **Key Features:**
 * - Battery consumption modeling
 * - Charging stop optimization
 * - Regenerative braking consideration
 * - Charging curve integration
 *
 * @example
 * ```typescript
 * const params: ElectricVehicleParams = {
 *   engineType: 'electric',
 *   model: {
 *     dimensions: {
 *       weightKG: 2000
 *     },
 *     engine: {
 *       consumption: {
 *         charging: {
 *           maxChargeKWH: 75,
 *           chargingCurve: [
 *             { chargeKWH: 0, timeToChargeMinutes: 0 },
 *             { chargeKWH: 37.5, timeToChargeMinutes: 30 },
 *             { chargeKWH: 75, timeToChargeMinutes: 75 }
 *           ],
 *           connectorTypes: ['IEC_62196_TYPE_2']
 *         },
 *         speedToConsumption: [
 *           { speedKMH: 50, consumptionUnitsPer100KM: 15 },
 *           { speedKMH: 90, consumptionUnitsPer100KM: 18 },
 *           { speedKMH: 120, consumptionUnitsPer100KM: 23 }
 *         ]
 *       }
 *     }
 *   },
 *   state: {
 *     currentChargePCT: 80
 *   },
 *   preferences: {
 *     chargingPreferences: {
 *       minChargeAtDestinationPCT: 20,
 *       minChargeAtChargingStopsPCT: 10
 *     }
 *   }
 * };
 * ```
 *
 * @group Vehicle
 */
export type ElectricVehicleParams = {
    /**
     * Electric vehicles (EV).
     *
     * @remarks
     * Identifies this as a battery electric vehicle.
     */
    engineType: 'electric';

    /**
     * Model (static properties) specifically for electric vehicles.
     *
     * @remarks
     * Should include battery capacity, charging curve, and consumption profiles.
     */
    model?: VehicleModel<'electric'>;

    /**
     * State specifically for electric vehicles.
     *
     * @remarks
     * Must include current battery charge (percentage or kWh) for range calculations.
     */
    state?: VehicleState<'electric'>;

    /**
     * Preferences specifically for electric vehicles.
     *
     * @remarks
     * Includes charging preferences for long-distance trips with charging stops.
     */
    preferences?: VehiclePreferences<'electric'>;
};

/**
 * Object describing vehicle details for routing.
 *
 * @remarks
 * Combines all vehicle-related parameters including:
 * - **Model**: Static properties (dimensions, engine specs)
 * - **State**: Current conditions (fuel/charge level, heading)
 * - **Preferences**: Routing preferences (charging stops, etc.)
 * - **Restrictions**: Cargo and usage restrictions
 *
 * **Three Types:**
 * 1. **Generic**: Basic vehicle without engine-specific features
 * 2. **Combustion**: Fuel-powered with consumption modeling
 * 3. **Electric**: Battery-powered with charging stop optimization
 *
 * **When to Specify:**
 * - Size restrictions matter (trucks, vans)
 * - Accurate range prediction needed
 * - EV routing with charging stops
 * - Hazardous material transport
 * - Commercial vehicle routing
 *
 * @example
 * ```typescript
 * // Generic vehicle with just dimensions
 * const van: VehicleParameters = {
 *   model: {
 *     dimensions: {
 *       heightMeters: 2.5,
 *       weightKG: 3500
 *     }
 *   },
 *   restrictions: {
 *     commercial: true
 *   }
 * };
 *
 * // Combustion vehicle with fuel tracking
 * const fuelCar: VehicleParameters = {
 *   engineType: 'combustion',
 *   model: {
 *     dimensions: { weightKG: 1500 }
 *   },
 *   state: {
 *     currentFuelInLiters: 45
 *   }
 * };
 *
 * // Electric vehicle with charging
 * const ev: VehicleParameters = {
 *   engineType: 'electric',
 *   model: {
 *     engine: {
 *       consumption: {
 *         charging: {
 *           maxChargeKWH: 75,
 *           connectorTypes: ['IEC_62196_TYPE_2']
 *         }
 *       }
 *     }
 *   },
 *   state: {
 *     currentChargePCT: 80
 *   },
 *   preferences: {
 *     chargingPreferences: {
 *       minChargeAtDestinationPCT: 20,
 *       minChargeAtChargingStopsPCT: 10
 *     }
 *   }
 * };
 *
 * // Hazmat truck
 * const hazmatTruck: VehicleParameters = {
 *   model: {
 *     dimensions: {
 *       heightMeters: 4.0,
 *       weightKG: 40000
 *     }
 *   },
 *   restrictions: {
 *     loadTypes: ['USHazmatClass3'],
 *     commercial: true,
 *     maxSpeedKMH: 80
 *   }
 * };
 * ```
 *
 * @group Vehicle
 */
export type VehicleParameters = (GenericVehicleParams | CombustionVehicleParams | ElectricVehicleParams) &
    VehicleRestrictions;
