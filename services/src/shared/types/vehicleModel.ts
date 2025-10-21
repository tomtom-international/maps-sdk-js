import { VehicleEngineModel, VehicleEngineType } from './vehicleEngineParams';

/**
 * A predefined vehicle model which comes from TomTom's curated Vehicle Database.
 *
 * @remarks
 * The Vehicle Database contains real-world vehicle specifications including:
 * - Physical dimensions
 * - Engine characteristics
 * - Consumption profiles
 * - Performance data
 *
 * Using a predefined model ensures accurate routing based on actual vehicle capabilities.
 *
 * **Benefits:**
 * - No need to manually specify technical details
 * - Continuously updated database
 * - Real-world tested consumption models
 * - Accurate range predictions
 *
 * @example
 * ```typescript
 * // Use a specific vehicle model
 * const teslaModel: PredefinedVehicleModel = {
 *   variantId: 'tesla-model-3-long-range-2023'
 * };
 *
 * // Use a specific truck model
 * const truckModel: PredefinedVehicleModel = {
 *   variantId: 'volvo-fh16-750-2022'
 * };
 * ```
 *
 * @group Vehicle
 */
export type PredefinedVehicleModel = {
    /**
     * The ID specifying the vehicle model with exact variant (if any).
     *
     * @remarks
     * Identifiers follow the pattern: `{make}-{model}-{variant}-{year}`
     *
     * Contact TomTom support to get available vehicle IDs from the database.
     *
     * @example
     * ```typescript
     * variantId: 'tesla-model-3-long-range-2023'
     * variantId: 'nissan-leaf-e-plus-2022'
     * variantId: 'mercedes-sprinter-316-2021'
     * ```
     */
    variantId: string;
};

/**
 * Physical properties of the vehicle (sizes and weights).
 *
 * @remarks
 * Dimensions are used to:
 * - Check road restrictions (height, width, weight limits)
 * - Avoid unsuitable routes (narrow streets, low bridges)
 * - Calculate toll costs (weight-based pricing)
 * - Determine parking availability
 *
 * **Important for:**
 * - Commercial vehicles (trucks, vans)
 * - Recreational vehicles (RVs, caravans)
 * - Oversized vehicles
 *
 * @example
 * ```typescript
 * // Standard delivery van
 * const vanDimensions: VehicleDimensions = {
 *   lengthMeters: 5.5,
 *   widthMeters: 2.0,
 *   heightMeters: 2.5,
 *   weightKG: 3500
 * };
 *
 * // Large truck
 * const truckDimensions: VehicleDimensions = {
 *   lengthMeters: 16.5,
 *   widthMeters: 2.55,
 *   heightMeters: 4.0,
 *   weightKG: 40000,
 *   axleWeightKG: 10000
 * };
 * ```
 *
 * @group Vehicle
 */
export type VehicleDimensions = {
    /**
     * Length of the vehicle in meters.
     *
     * @remarks
     * A value of 0 means that length restrictions are not considered.
     *
     * **Typical Values:**
     * - Small car: 3-4 m
     * - SUV/Van: 4-6 m
     * - Small truck: 6-10 m
     * - Large truck: 12-18 m
     *
     * @default 0
     *
     * @example
     * ```typescript
     * lengthMeters: 5.5   // Delivery van
     * lengthMeters: 16.5  // Articulated truck
     * ```
     */
    lengthMeters?: number;

    /**
     * Width of the vehicle in meters.
     *
     * @remarks
     * A value of 0 means that width restrictions are not considered.
     *
     * **Typical Values:**
     * - Standard car: 1.7-1.9 m
     * - Van/truck: 2.0-2.5 m
     * - Maximum legal (Europe/US): 2.55 m
     *
     * @default 0
     *
     * @example
     * ```typescript
     * widthMeters: 1.8   // Standard car
     * widthMeters: 2.5   // Wide truck
     * ```
     */
    widthMeters?: number;

    /**
     * Height of the vehicle in meters.
     *
     * @remarks
     * A value of 0 means that height restrictions are not considered.
     *
     * **Typical Values:**
     * - Sedan: 1.4-1.5 m
     * - SUV: 1.7-1.9 m
     * - Van: 2.0-2.8 m
     * - Truck: 3.5-4.5 m
     *
     * **Important:** Critical for avoiding low bridges and tunnels.
     *
     * @default 0
     *
     * @example
     * ```typescript
     * heightMeters: 1.5  // Sedan
     * heightMeters: 4.0  // Container truck
     * ```
     */
    heightMeters?: number;

    /**
     * Weight of the vehicle in kilograms.
     *
     * @remarks
     * If a detailed Consumption model is specified, refer to the Consumption model
     * parameters section for the documentation of vehicleWeight.
     *
     * If a detailed Consumption model is not specified, and the value of vehicleWeight
     * is non-zero, then weight restrictions are considered.
     *
     * In all other cases, this parameter is ignored.
     *
     * **Typical Values:**
     * - Small car: 1,000-1,500 kg
     * - SUV: 1,800-2,500 kg
     * - Van: 2,000-3,500 kg
     * - Truck (empty): 7,500-12,000 kg
     * - Truck (loaded): 20,000-40,000 kg
     *
     * @default 0
     *
     * @example
     * ```typescript
     * weightKG: 1500   // Compact car
     * weightKG: 3500   // Loaded van
     * weightKG: 40000  // Fully loaded truck
     * ```
     */
    weightKG?: number;

    /**
     * Weight per axle of the vehicle in kilograms.
     *
     * @remarks
     * A value of 0 means that weight restrictions per axle are not considered.
     *
     * **Use Cases:**
     * - Older bridges with axle weight limits
     * - Specialized roads with axle restrictions
     * - Heavy load transport
     *
     * **Typical Values:**
     * - Single axle: 6,000-10,000 kg
     * - Tandem axle: 8,000-11,500 kg (per axle)
     *
     * @default 0
     *
     * @example
     * ```typescript
     * axleWeightKG: 10000  // Heavy truck
     * ```
     */
    axleWeightKG?: number;
};

/**
 * Explicit vehicle model with manually specified properties.
 *
 * @remarks
 * Use this when you want to specify custom vehicle characteristics instead of
 * using a predefined model from the Vehicle Database.
 *
 * **When to Use:**
 * - Custom or modified vehicles
 * - Vehicles not in the database
 * - Testing different configurations
 * - Generic vehicle types
 *
 * @typeParam E - The engine type (combustion, electric, or undefined for generic)
 *
 * @example
 * ```typescript
 * // Generic vehicle with dimensions only
 * const customVan: ExplicitVehicleModel<undefined> = {
 *   dimensions: {
 *     lengthMeters: 5.5,
 *     heightMeters: 2.5,
 *     weightKG: 3500
 *   }
 * };
 *
 * // Electric vehicle with consumption model
 * const customEV: ExplicitVehicleModel<'electric'> = {
 *   dimensions: {
 *     weightKG: 2000
 *   },
 *   engine: {
 *     consumption: {
 *       charging: {
 *         maxChargeKWH: 75,
 *         chargingCurve: [...]
 *       }
 *     }
 *   }
 * };
 * ```
 *
 * @group Vehicle
 */
export type ExplicitVehicleModel<E extends VehicleEngineType> = {
    /**
     * Physical dimensions of the vehicle.
     *
     * @remarks
     * Specify sizes and weights to enable restriction checking.
     */
    dimensions?: VehicleDimensions;

    /**
     * Engine model with consumption characteristics.
     *
     * @remarks
     * Required for accurate fuel/energy consumption calculations and
     * EV routing with charging stops.
     */
    engine?: VehicleEngineModel<E>;
};

/**
 * Vehicle model definition - either predefined or explicitly specified.
 *
 * @remarks
 * Represents the static properties of a vehicle (model characteristics that
 * don't change during a journey).
 *
 * **Two Options:**
 * 1. **Predefined**: Use a vehicle from TomTom's database (recommended)
 * 2. **Explicit**: Manually specify dimensions and engine characteristics
 *
 * @typeParam E - The engine type (combustion, electric, or undefined for generic)
 *
 * @example
 * ```typescript
 * // Option 1: Predefined model
 * const model: VehicleModel = {
 *   variantId: 'tesla-model-3-long-range-2023'
 * };
 *
 * // Option 2: Explicit model
 * const customModel: VehicleModel = {
 *   dimensions: {
 *     heightMeters: 4.0,
 *     weightKG: 25000
 *   }
 * };
 * ```
 *
 * @group Vehicle
 */
export type VehicleModel<E extends VehicleEngineType = undefined> = PredefinedVehicleModel | ExplicitVehicleModel<E>;
