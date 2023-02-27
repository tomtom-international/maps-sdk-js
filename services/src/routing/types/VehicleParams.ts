import { VehicleEngine } from "./VehicleEngineParams";

/**
 * Physical properties of the vehicle (sizes and weights).
 * @group Calculate Route
 * @category Types
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

/**
 * @group Calculate Route
 * @category Variables
 */
export const loadTypes = [
    "USHazmatClass1",
    "USHazmatClass2",
    "USHazmatClass3",
    "USHazmatClass4",
    "USHazmatClass5",
    "USHazmatClass6",
    "USHazmatClass7",
    "USHazmatClass8",
    "USHazmatClass9",
    "otherHazmatExplosive",
    "otherHazmatGeneral",
    "otherHazmatHarmfulToWater"
];

/**
 * Known hazardous truck load types. Should be used for trucks carrying hazardous materials.
 *
 * Use these values for routing in the USA:
 * * USHazmatClass1: Explosives
 * * USHazmatClass2: Compressed gas
 * * USHazmatClass3: Flammable liquids
 * * USHazmatClass4: Flammable solids
 * * USHazmatClass5: Oxidizers
 * * USHazmatClass6: Poisons
 * * USHazmatClass7: Radioactive
 * * USHazmatClass8: Corrosives
 * * USHazmatClass9: Miscellaneous
 *
 * Use these values for routing in all other countries:
 * * otherHazmatExplosive: Explosives
 * * otherHazmatGeneral: Miscellaneous
 * * otherHazmatHarmfulToWater: Harmful to water
 * @group Calculate Route
 * @category Types
 */
export type LoadType = (typeof loadTypes)[number];

/**
 *  Object describing vehicle details
 *  @group Calculate Route
 *  @category Types
 */
export type VehicleParameters = {
    /**
     * Vehicle energy consumption attributes.
     */
    engine?: VehicleEngine;
    /**
     * Physical properties of the vehicle (sizes and weights).
     */
    dimensions?: VehicleDimensions;
    /**
     * Specifies types of cargo that may be classified as hazardous materials and are restricted from some roads.
     */
    loadTypes?: LoadType[];
    /**
     * Maximum speed of the vehicle in kilometers/hour.
     * * Must have a value in the range [0, 250].
     * * A value of 0 means that an appropriate value for the vehicle will be determined and applied during route planning.
     *
     * @default 0
     */
    maxSpeedKMH?: number;
    /**
     * Subjects the vehicle to ADR tunnel restrictions.
     * * Vehicles with code B are restricted from roads with ADR tunnel categories B, C, D, and E.
     * * Vehicles with code C are restricted from roads with ADR tunnel categories C, D, and E.
     * * Vehicles with code D are restricted from roads with ADR tunnel categories D and E.
     * * Vehicles with code E are restricted from roads with ADR tunnel category E.
     *
     * Notes:
     * If travelMode is pedestrian or bicycle, adrCode is not considered.
     * The adrCode and loadType parameters are independent; please provide both if applicable.
     * @see https://unece.org/about-adr
     */
    adrCode?: "B" | "C" | "D" | "E";
    /**
     *
     * The vehicle is used for commercial purposes (big letters on the side) and thus may not be allowed to drive on some roads.
     * This restriction is applicable only in some countries (e.g. US).
     *
     * @default false
     */
    commercial?: boolean;
};
