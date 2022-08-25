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
 */
export type LoadType = typeof loadTypes[number];

/**
 * Specifies the speed-dependent component of consumption.
 * Provided as an unordered list of speed/consumption-rate pairs.
 * The list defines points on a consumption curve.
 *
 * Consumption rates for speeds not in the list are found as follows:
 * By linear interpolation, if the given speed lies in between two speeds in the list.
 * By linear extrapolation otherwise, assuming a constant (&ΔConsumption/&ΔSpeed) determined by the nearest two points in the list.
 *
 * The list must contain between 1 and 25 points (inclusive), and may not contain duplicate points for the same speed.
 * If it only contains a single point, then the consumption rate of that point is used without further processing.
 * Consumption specified for the largest speed must be greater than or equal to that of the penultimate largest speed. This ensures that extrapolation does not lead to negative consumption rates.
 * Similarly, consumption values specified for the two smallest speeds in the list cannot lead to a negative consumption rate for any smaller speed. The minimum and maximum values described here refer to the valid range for the consumption values (expressed in kWh/100km).
 *
 * Value type: Colon-delimited list of ElectricConstantSpeedConsumptionPair.
 * Minimum value: 01
 * Maximum value: 100000.0
 */
export type SpeedToConsumptionRate = { speedKMH: number; consumptionUnitsPer100KM: number };

/**
 * Parameters related to consumption efficiency.
 */
export type ConsumptionModelEfficiency = {
    /**
     * Specifies the efficiency of converting stored to kinetic energy when the vehicle accelerates.
     * * For combustion, stored energy is in the form of fuel (KineticEnergyGained/ChemicalEnergyConsumed).
     * ChemicalEnergyConsumed is obtained by converting consumed fuel to chemical energy using fuelEnergyDensityInMJoulesPerLiter.
     * * For electric, stored energy is energy stored in batteries (KineticEnergyGained/ElectricEnergyConsumed).
     * * Note: This must be paired with deceleration efficiency.
     *
     * Minimum value: 0
     *
     * Maximum value: 1/deceleration
     */
    acceleration?: number;

    /**
     * Specifies the efficiency of converting kinetic energy to stored or not consumed energy when the vehicle decelerates.
     * * For combustion, the energy gain is about not consuming fuel (ChemicalEnergySaved/PotentialEnergyLost).
     * * For electric, the energy gain is about not consuming but also recharging batteries (ElectricEnergyGained/PotentialEnergyLost).
     * (i.e., ChemicalEnergySaved/KineticEnergyLost).
     * * ChemicalEnergySaved is obtained by converting saved (not consumed) fuel to energy using fuelEnergyDensityInMJoulesPerLiter.
     * * Note: This must be paired with acceleration efficiency.
     *
     * Minimum value: 0
     *
     * Maximum value: 1/acceleration
     */
    deceleration?: number;

    /**
     * Specifies the efficiency of converting stored to potential energy when the vehicle gains elevation.
     * * For combustion, stored energy is chemical energy stored in fuel (PotentialEnergyGained/ChemicalEnergyConsumed).
     * ChemicalEnergyConsumed is obtained by converting consumed fuel to chemical energy using fuelEnergyDensityInMJoulesPerLiter.
     * * For electric, stored energy is energy stored in batteries (PotentialEnergyGained/ElectricEnergyConsumed).
     *
     * Note: This must be paired with downhill efficiency.
     *
     * Minimum value: 0
     *
     * Maximum value: 1/downhill
     */
    uphill?: number;

    /**
     * Specifies the efficiency of converting potential to stored or not consumed energy when the vehicle loses elevation,
     * * For combustion, the energy gain is about not consuming fuel (ChemicalEnergySaved/PotentialEnergyLost).
     * ChemicalEnergySaved is obtained by converting saved (not consumed) fuel to energy using fuelEnergyDensityInMJoulesPerLiter.
     * * For electric, the energy gain is about not consuming but also recharging batteries (ElectricEnergyGained/PotentialEnergyLost).
     *
     * * Note: This must be paired with uphill efficiency.
     *
     * Minimum value: 0
     *
     * Maximum value: 1/uphill
     */
    downhill?: number;
};

/**
 * The Combustion consumption model is used when the vehicleEngineType value is set to "combustion".
 */
export type CombustionConsumptionModel = {
    /**
     * Specifies the speed-dependent component of consumption based on km/h and liters.
     */
    speedsToConsumptionsLiters: SpeedToConsumptionRate[];

    /**
     * Specifies the amount of fuel consumed for sustaining auxiliary systems of the vehicle, in liters per hour.
     *
     * It can be used to specify consumption due to devices and systems such as AC systems, radio, heating, etc.
     *
     * Minimum value: 0
     */
    auxiliaryPowerInLitersPerHour?: number;

    /**
     * Specifies the amount of chemical energy stored in one liter of fuel in megajoules (MJ).
     * * It is used in conjunction with the Efficiency parameters for conversions between saved or consumed energy and fuel.
     * * For example, energy density is 34.2 MJ/l for gasoline, and 35.8 MJ/l for Diesel fuel.
     * * This parameter must be used/required if any *Efficiency parameter is set.
     *
     * Minimum value: 1.0
     */
    fuelEnergyDensityInMJoulesPerLiter?: number;

    /**
     * Specifies the current supply of fuel in liters.
     *
     * Minimum value: 0
     */
    currentFuelLiters?: number;
};

export type ElectricConsumptionModel = {
    /**
     * Specifies the speed-dependent component of consumption based on km/h and kW/h.
     */
    speedsToConsumptionsKWH: SpeedToConsumptionRate[];
    /**
     * Specifies the amount of power consumed for sustaining auxiliary systems, in kilowatts (kW).
     * * It can be used to specify consumption due to devices and systems such as AC systems, radio, heating, etc.
     *
     * Minimum value: 0
     */
    auxiliaryPowerInkW?: number;
    /**
     * Specifies the electric energy in kWh consumed by the vehicle through gaining 1000 meters of elevation.
     * * Note: It must be paired with recuperationInkWhPerKMAltitudeLoss.
     * * Note: It cannot be used with any efficiency parameters.
     *
     * Minimum value: recuperationInkWhPerKMAltitudeLoss
     *
     * Maximum value: 500.0
     */
    consumptionInKWHPerKMAltitudeGain?: number;
    /**
     * Specifies the electric energy in kWh gained by the vehicle through losing 1000 meters of elevation.
     * Note: It must be paired with consumptionInkWhPerKMAltitudeGain.
     * Note: It cannot be used with accelerationEfficiency, decelerationEfficiency, uphillEfficiency or downhillEfficiency.
     *
     * Minimum value: 0.0
     * Maximum value: consumptionInkWhPerKMAltitudeGain
     */
    recuperationInKWHPerKMAltitudeLoss?: number;
    /**
     * Specifies the current electric energy supply in kilowatt-hours (kWh).
     * * Note: Requires maxChargeInkWh to be set.
     *
     * Minimum value: 0
     *
     * Maximum value: maxChargeInkWh
     */
    currentChargeKWH?: number;
    /**
     * Specifies the maximum electric energy supply in kilowatt-hours (kWh) that may be stored in the vehicle's battery.
     * * Note: Requires currentChargeInkWh to be set.
     *
     * Minimum value: currentChargeInkWh
     */
    maxChargeKWH?: number;
};

/**
 * The engine type of the vehicle.
 * * When a detailed Consumption model is specified, it must be consistent with the provided engine type.
 *
 * @default combustion
 */
export type VehicleEngineType = "combustion" | "electric";

/**
 * The consumption model describes vehicle energy (fuel/electricity) consumption attributes.
 * * "combustion" vehicles can contain a combustion consumption model
 * * "electric" vehicles (EVs) can contain an EV consumption model
 */
export type VehicleConsumption<MODEL = CombustionConsumptionModel | ElectricConsumptionModel> = MODEL & {
    /**
     * The engine type of the vehicle.
     * * When a detailed consumption model is specified, it must be consistent with the value of engineType.
     *
     * @default combustion
     */
    engineType?: VehicleEngineType;
    /**
     * Parameters related to consumption efficiency.
     */
    efficiency: ConsumptionModelEfficiency;
};

/**
 *  Object describing vehicle details
 */
export type VehicleParameters = {
    /**
     * Vehicle energy consumption attributes.
     */
    consumption?: VehicleConsumption;
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
     * If travelMode is pedestrian or bicycle,vehicleAdrTunnelRestrictionCode is not considered.
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
