import { isNil } from 'lodash-es';
import type {
    CombustionEngineModel,
    ConsumptionModelEfficiency,
    ElectricConsumptionModel,
    ElectricEngineModel,
    SpeedToConsumptionRate,
    VehicleEngineType,
} from '../types/vehicleEngineParams';
import type { ExplicitVehicleModel } from '../types/vehicleModel';
import type { ElectricVehicleParams, VehicleParameters } from '../types/vehicleParams';
import type { ChargingPreferencesKWH, ChargingPreferencesPCT } from '../types/vehiclePreferences';
import type { CombustionVehicleState, ElectricVehicleStateKWH, ElectricVehicleStatePCT } from '../types/vehicleState';

/**
 * The consumption, charge and charging-preference query parameters, keyed by the name the API takes
 * them under. Every routing endpoint spells these identically; they differ only in whether they
 * `set` or `append` them, so each request builder writes the entries itself.
 *
 * @ignore
 */
export type EnergyQueryParams = Record<string, string>;

const withParameter = (parameters: EnergyQueryParams, name: string, value: number | string | undefined): void => {
    if (!isNil(value)) parameters[name] = String(value);
};

// e.g. 50,6.3:130,11.5
const speedToConsumptionString = (rates: SpeedToConsumptionRate[]): string =>
    rates.map((rate) => `${rate.speedKMH},${rate.consumptionUnitsPer100KM}`).join(':');

/** Efficiency parameters, which are spelled the same for either engine type. @ignore */
export const efficiencyParams = (efficiency?: ConsumptionModelEfficiency): EnergyQueryParams => {
    const parameters: EnergyQueryParams = {};
    if (!efficiency) return parameters;

    withParameter(parameters, 'accelerationEfficiency', efficiency.acceleration);
    withParameter(parameters, 'decelerationEfficiency', efficiency.deceleration);
    withParameter(parameters, 'uphillEfficiency', efficiency.uphill);
    withParameter(parameters, 'downhillEfficiency', efficiency.downhill);

    return parameters;
};

/** @ignore */
export const electricConsumptionParams = (consumption: ElectricConsumptionModel): EnergyQueryParams => {
    const parameters: EnergyQueryParams = {};
    if (consumption.speedsToConsumptionsKWH?.length)
        parameters.constantSpeedConsumptionInkWhPerHundredkm = speedToConsumptionString(
            consumption.speedsToConsumptionsKWH,
        );

    withParameter(parameters, 'auxiliaryPowerInkW', consumption.auxiliaryPowerInkW);
    withParameter(parameters, 'consumptionInkWhPerkmAltitudeGain', consumption.consumptionInKWHPerKMAltitudeGain);
    withParameter(parameters, 'recuperationInkWhPerkmAltitudeLoss', consumption.recuperationInKWHPerKMAltitudeLoss);

    return { ...parameters, ...efficiencyParams(consumption.efficiency) };
};

/** @ignore */
export const combustionConsumptionParams = (engine: CombustionEngineModel): EnergyQueryParams => {
    const consumption = engine.consumption;
    const parameters: EnergyQueryParams = {};
    if (consumption.speedsToConsumptionsLiters?.length)
        parameters.constantSpeedConsumptionInLitersPerHundredkm = speedToConsumptionString(
            consumption.speedsToConsumptionsLiters,
        );

    withParameter(parameters, 'auxiliaryPowerInLitersPerHour', consumption.auxiliaryPowerInLitersPerHour);
    withParameter(parameters, 'fuelEnergyDensityInMJoulesPerLiter', consumption.fuelEnergyDensityInMJoulesPerLiter);

    return { ...parameters, ...efficiencyParams(consumption.efficiency) };
};

/**
 * The battery capacity declared on an explicit electric model, which every percentage-based charge
 * and charging preference is converted against.
 *
 * @ignore
 */
export const maxChargeKWHOf = (vehicle: VehicleParameters): number | undefined => {
    if (!vehicle.model || 'variantId' in vehicle.model) return undefined;

    const engine = (vehicle.model as ExplicitVehicleModel<VehicleEngineType>).engine as ElectricEngineModel | undefined;

    return engine?.charging?.maxChargeKWH;
};

/** @ignore */
export const maxChargeParams = (engine: ElectricEngineModel): EnergyQueryParams => {
    const parameters: EnergyQueryParams = {};
    if (engine.charging?.maxChargeKWH) parameters.maxChargeInkWh = String(engine.charging.maxChargeKWH);

    return parameters;
};

/**
 * The charge a vehicle sets off with, always as kWh: a percentage is only meaningful once converted
 * against the battery capacity, so a percentage without one yields nothing.
 *
 * @ignore
 */
export const currentChargeParams = (vehicle: VehicleParameters): EnergyQueryParams => {
    const parameters: EnergyQueryParams = {};
    const absoluteState = vehicle.state as ElectricVehicleStateKWH | undefined;
    if (absoluteState?.currentChargeInkWh) {
        parameters.currentChargeInkWh = String(absoluteState.currentChargeInkWh);

        return parameters;
    }

    const percentage = (vehicle.state as ElectricVehicleStatePCT | undefined)?.currentChargePCT;
    const maxChargeKWH = maxChargeKWHOf(vehicle);
    if (percentage && maxChargeKWH) parameters.currentChargeInkWh = String((maxChargeKWH * percentage) / 100);

    return parameters;
};

/** @ignore */
export const currentFuelParams = (vehicle: VehicleParameters): EnergyQueryParams => {
    const parameters: EnergyQueryParams = {};
    withParameter(
        parameters,
        'currentFuelInLiters',
        (vehicle.state as CombustionVehicleState | undefined)?.currentFuelInLiters,
    );

    return parameters;
};

/**
 * The minimum charge to keep at stops and on arrival, always as kWh. Absolute values win; percentages
 * need the battery capacity to convert against, and yield nothing without one.
 *
 * @ignore
 */
export const chargingPreferenceParams = (vehicle: VehicleParameters): EnergyQueryParams => {
    const preferences = (vehicle as ElectricVehicleParams).preferences?.chargingPreferences;
    const parameters: EnergyQueryParams = {};
    if (!preferences) return parameters;

    const absolutePreferences = preferences as ChargingPreferencesKWH;
    if (
        !isNil(absolutePreferences.minChargeAtDestinationInkWh) ||
        !isNil(absolutePreferences.minChargeAtChargingStopsInkWh)
    ) {
        withParameter(parameters, 'minChargeAtDestinationInkWh', absolutePreferences.minChargeAtDestinationInkWh);
        withParameter(parameters, 'minChargeAtChargingStopsInkWh', absolutePreferences.minChargeAtChargingStopsInkWh);

        return parameters;
    }

    const maxChargeKWH = maxChargeKWHOf(vehicle);
    if (!maxChargeKWH) return parameters;

    const percentagePreferences = preferences as ChargingPreferencesPCT;
    if (!isNil(percentagePreferences.minChargeAtDestinationPCT))
        parameters.minChargeAtDestinationInkWh = String(
            (maxChargeKWH * percentagePreferences.minChargeAtDestinationPCT) / 100,
        );

    if (!isNil(percentagePreferences.minChargeAtChargingStopsPCT))
        parameters.minChargeAtChargingStopsInkWh = String(
            (maxChargeKWH * percentagePreferences.minChargeAtChargingStopsPCT) / 100,
        );

    return parameters;
};

/** Writes every entry with `append`, for the endpoints that build their query that way. @ignore */
export const appendEnergyParams = (urlParams: URLSearchParams, parameters: EnergyQueryParams): void => {
    for (const [name, value] of Object.entries(parameters)) urlParams.append(name, value);
};

/** Writes every entry with `set`, for the endpoints that build their query that way. @ignore */
export const setEnergyParams = (urlParams: URLSearchParams, parameters: EnergyQueryParams): void => {
    for (const [name, value] of Object.entries(parameters)) urlParams.set(name, value);
};
