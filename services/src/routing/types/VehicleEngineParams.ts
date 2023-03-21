import { CurrentType, PlugType } from "@anw/maps-sdk-js/core";

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

export type ConsumptionModelBase = {
    /**
     * Parameters related to consumption efficiency.
     */
    efficiency?: ConsumptionModelEfficiency;
};

export type CombustionEngineModel = {
    /**
     * The consumption model for the combustion engine.
     * * This model is static for the vehicle and does not change along time.
     */
    consumption: CombustionConsumptionModel;
};

/**
 * The combustion consumption model is used when the engine type is set to "combustion".
 */
export type CombustionConsumptionModel = ConsumptionModelBase & {
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
};

export type BatteryCurve = {
    /**
     * Minimum: 0
     */
    stateOfChargeInkWh: number;
    /**
     * Must be larger than 0.
     */
    maxPowerInkW: number;
};

export type ChargingConnector = {
    /**
     * One of the values AC1, AC3 for single- or three-phase alternating current, or DC for direct current.
     */
    currentType: CurrentType;
    /**
     * The compatible plug types.
     * * Must have at least one element.
     */
    plugTypes: [PlugType, ...PlugType[]];
    /**
     * Minimum 0, maximum 1.
     * @default 1
     */
    efficiency?: number;
    /**
     * @default 0
     */
    baseLoadInkW?: number;
    /**
     * If not specified the power is only limited by the charging facility.
     * * Must be a positive number or zero, where 0 implies no boundary applies.
     */
    maxPowerInkW?: number;
    /**
     * If not specified the voltage is only limited by the charging facility.
     * * Must be a positive number or zero, where 0 implies no boundary applies.
     */
    maxVoltageInV?: number;
    /**
     * If not specified the amperage is only limited by the charging facility.
     * * Must be a positive number or zero, where 0 implies no boundary applies.
     */
    maxCurrentInA?: number;
    /**
     * Must contain the fields minVoltageInV and maxVoltageInV
     * specifying minimal (included) and maximal (excluded) voltage values.
     */
    voltageRange?: {
        /**
         * Minimum: 0.
         */
        minVoltageInV?: number;
        /**
         * Minimum: minVoltageInV.
         */
        maxVoltageInV?: number;
    };
};

/**
 * The charging model describes how a car's battery performs,
 * and it's used mostly for Long Distance EV Routing calculations.
 */
export type ChargingModel = {
    /**
     * Specifies the maximum electric energy supply in kilowatt-hours (kWh) that may be stored in the vehicle's battery.
     * * Note: Requires state.currentChargeInPCT to be set.
     *
     * Minimum value: kWh equivalent to state.currentChargePCT
     */
    maxChargeKWH: number;

    /**
     * Must contain from zero to up to 20 (inclusive) json objects describing a battery point,
     * each containing stateOfChargeInkWh and maxPowerInkW.
     *
     * None of the stateOfChargeInkWh values from such an object may equal any other stateOfChargeInkWh of an object.
     * maxPowerInkW must be larger than zero.
     */
    batteryCurve?: BatteryCurve[];

    /**
     * Must be a non-empty array of chargingConnector elements.
     *
     * No chargingConnector may be equivalent to another, where equivalent chargingConnector elements:
     * * have the same currentType
     * * share at least one element of plugTypes
     * * have an overlapping voltageRange
     */
    chargingConnectors?: [ChargingConnector, ...ChargingConnector[]];

    /**
     * If not specified the default value 60 applies. Must be larger than or equal to zero.
     * @default 60
     */
    chargingTimeOffsetInSec?: number;
};

/**
 * The electric consumption model is used when the engine type is set to "combustion".
 */
export type ElectricConsumptionModel = ConsumptionModelBase & {
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
};

/**
 * Charging preferences for Long Distance EV Routing.
 * * Specifying these preferences will trigger the calculation of charging stops along your route.
 * * Requires the ChargingModel to be set in consumption.charging.
 */
export type ChargingPreferences = {
    /**
     * The minimum battery % you wish to arrive at your destination with.
     * Minimum: 0, maximum: 100.
     */
    minChargeAtDestinationPCT: number;
    /**
     * The minimum battery % you wish to arrive at each charging station with.
     * * However, the remaining charge at the first charging stop may be lower.
     * * Minimum: 0, maximum: 50.
     */
    minChargeAtChargingStopsPCT: number;
};

/**
 * The available engine types.
 */
export const engineTypes = ["combustion", "electric"] as const;

/**
 * The engine type of the vehicle.
 * * When a detailed Consumption model is specified, it must be consistent with the provided engine type.
 */
export type VehicleEngineType = (typeof engineTypes)[number];

export type VehicleEngineBase<E extends VehicleEngineType, M extends CombustionEngineModel | ElectricEngineModel> = {
    /**
     * The engine type of the vehicle.
     * * When an engine (consumption/charging) model is specified, it must be consistent with this type.
     */
    type: E;
    /**
     * The engine model.
     * * The model describes the vehicle as such and does not change through time.
     * * Must be consistent with the engine type.
     */
    model: M;
};

export type CombustionVehicleEngine = VehicleEngineBase<"combustion", CombustionEngineModel> & {
    /**
     * Specifies the current supply of fuel in liters.
     *
     * Minimum value: 0
     */
    currentFuelInLiters: number;
};

export type ElectricEngineModel = {
    /**
     * Electric engine consumption model.
     */
    consumption: ElectricConsumptionModel;
    /**
     * Battery charging model.
     */
    charging?: ChargingModel;
};

export type ElectricVehicleEngine = VehicleEngineBase<"electric", ElectricEngineModel> & {
    /**
     * Specifies the current battery charge in %.
     * * Note: Requires model.charging.maxChargeKWH to be set.
     * * Minimum: 0, maximum: 100.
     */
    currentChargePCT: number;
    /**
     * Charging preferences for Long Distance EV Routing.
     * * Specifying these preferences will trigger the calculation of charging stops along your route.
     * * Requires the ElectricConsumptionModel to be set.
     * @see https://developer.tomtom.com/routing-api/documentation/extended-routing/long-distance-ev-routing
     */
    chargingPreferences?: ChargingPreferences;
};

/**
 * The consumption model describes vehicle energy (fuel/electricity) consumption attributes.
 * * "combustion" vehicles can contain a combustion consumption model
 * * "electric" vehicles (EVs) can contain an EV consumption model
 */
export type VehicleEngine = CombustionVehicleEngine | ElectricVehicleEngine;
