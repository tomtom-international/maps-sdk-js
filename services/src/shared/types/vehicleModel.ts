import { VehicleEngineModel, VehicleEngineType } from './vehicleEngineParams';

/**
 * A predefined vehicle model which comes from TomTom's curated Vehicle Database.
 */
export type PredefinedVehicleModel = {
    /**
     * The ID specifying the vehicle model with exact variant (if any).
     */
    variantId: string;
};

/**
 * Physical properties of the vehicle (sizes and weights).
 */
export type VehicleDimensions = {
    /**
     * Length of the vehicle in meters.
     * * A value of 0 means that length restrictions are not considered.
     *
     * @default 0
     */
    lengthMeters?: number;

    /**
     * Width of the vehicle in meters.
     * * A value of 0 means that width restrictions are not considered.
     *
     * @default 0
     */
    widthMeters?: number;

    /**
     * Height of the vehicle in meters.
     * * A value of 0 means that height restrictions are not considered.
     *
     * @default 0
     */
    heightMeters?: number;

    /**
     * Weight of the vehicle in kilograms.
     *
     * * If a detailed Consumption model is specified, refer to the following Consumption model parameters section for the documentation of vehicleWeight.
     * * If a detailed Consumption model is not specified, and the value of vehicleWeight is non-zero, then weight restrictions are considered.
     * * In all other cases, this parameter is ignored.
     *
     * @default 0
     */
    weightKG?: number;

    /**
     * Weight per axle of the vehicle in kilograms.
     * * A value of 0 means that weight restrictions per axle are not considered.
     *
     * @default 0
     */
    axleWeightKG?: number;
};

export type ExplicitVehicleModel<E extends VehicleEngineType> = {
    dimensions?: VehicleDimensions;
    engine?: VehicleEngineModel<E>;
};

export type VehicleModel<E extends VehicleEngineType = undefined> = PredefinedVehicleModel | ExplicitVehicleModel<E>;
