import { isNil } from 'lodash-es';
import { appendByRepeatingParamName } from './requestBuildingUtils';
import {
    CombustionEngineModel,
    ConsumptionModelEfficiency,
    ElectricConsumptionModel,
    ElectricEngineModel,
    SpeedToConsumptionRate,
    VehicleEngineModel,
    VehicleEngineType,
} from './types/vehicleEngineParams';
import { VehicleDimensions } from './types/vehicleModel';
import { ElectricVehicleParams, VehicleParameters } from './types/vehicleParams';
import { ChargingPreferencesKWH, ChargingPreferencesPCT } from './types/vehiclePreferences';
import { ElectricVehicleStateKWH, ElectricVehicleStatePCT, VehicleState } from './types/vehicleState';

const appendConsumptionEfficiency = (urlParams: URLSearchParams, efficiency?: ConsumptionModelEfficiency): void => {
    if (efficiency) {
        !isNil(efficiency.acceleration) && urlParams.append('accelerationEfficiency', String(efficiency.acceleration));
        !isNil(efficiency.deceleration) && urlParams.append('decelerationEfficiency', String(efficiency.deceleration));
        !isNil(efficiency.uphill) && urlParams.append('uphillEfficiency', String(efficiency.uphill));
        !isNil(efficiency.downhill) && urlParams.append('downhillEfficiency', String(efficiency.downhill));
    }
};

// e.g. 50,6.3:130,11.5
const buildSpeedToConsumptionString = (speedsToConsumptions: SpeedToConsumptionRate[]): string =>
    speedsToConsumptions
        .map((speedToConsumption) => `${speedToConsumption.speedKMH},${speedToConsumption.consumptionUnitsPer100KM}`)
        .join(':');

const appendCombustionEngine = (urlParams: URLSearchParams, engine: CombustionEngineModel): void => {
    // (no need to append combustion vehicleEngineType since it's the default)
    const consumptionModel = engine.consumption;
    consumptionModel.speedsToConsumptionsLiters &&
        urlParams.append(
            'constantSpeedConsumptionInLitersPerHundredkm',
            buildSpeedToConsumptionString(consumptionModel.speedsToConsumptionsLiters),
        );
    !isNil(consumptionModel.auxiliaryPowerInLitersPerHour) &&
        urlParams.append('auxiliaryPowerInLitersPerHour', String(consumptionModel.auxiliaryPowerInLitersPerHour));
    !isNil(consumptionModel.fuelEnergyDensityInMJoulesPerLiter) &&
        urlParams.append(
            'fuelEnergyDensityInMJoulesPerLiter',
            String(consumptionModel.fuelEnergyDensityInMJoulesPerLiter),
        );
};

const appendElectricConsumptionModel = (urlParams: URLSearchParams, model: ElectricConsumptionModel): void => {
    model.speedsToConsumptionsKWH &&
        urlParams.append(
            'constantSpeedConsumptionInkWhPerHundredkm',
            buildSpeedToConsumptionString(model.speedsToConsumptionsKWH),
        );
    !isNil(model.auxiliaryPowerInkW) && urlParams.append('auxiliaryPowerInkW', String(model.auxiliaryPowerInkW));
    !isNil(model.consumptionInKWHPerKMAltitudeGain) &&
        urlParams.append('consumptionInkWhPerkmAltitudeGain', String(model.consumptionInKWHPerKMAltitudeGain));
    !isNil(model.recuperationInKWHPerKMAltitudeLoss) &&
        urlParams.append('recuperationInkWhPerkmAltitudeLoss', String(model.recuperationInKWHPerKMAltitudeLoss));
};

const appendChargingModel = (urlParams: URLSearchParams, engine: ElectricEngineModel): void => {
    const chargingModel = engine.charging;
    if (chargingModel?.maxChargeKWH) {
        urlParams.append('maxChargeInkWh', String(chargingModel.maxChargeKWH));
    }
    // (the rest of the charging model goes as POST data)
};

const appendVehicleState = (urlParams: URLSearchParams, vehicleParams: VehicleParameters): void => {
    if (!vehicleParams.state) {
        return;
    }

    // Generic state props:
    vehicleParams.state.heading && urlParams.append('vehicleHeading', String(vehicleParams.state.heading));

    if (!('engineType' in vehicleParams)) {
        // Generic vehicle, no engine-specific state to append:
        return;
    }

    // Engine-specific state props:
    if (vehicleParams.engineType === 'combustion') {
        const combustionState: VehicleState<'combustion'> = vehicleParams.state;
        combustionState.currentFuelInLiters &&
            urlParams.append('currentFuelInLiters', String(combustionState.currentFuelInLiters));
    } else if (vehicleParams.engineType === 'electric') {
        const electricState: VehicleState<'electric'> = vehicleParams.state;
        const kwhElecticState = electricState as ElectricVehicleStateKWH;
        const pctElecticState = electricState as ElectricVehicleStatePCT;

        if (kwhElecticState.currentChargeInkWh) {
            urlParams.append('currentChargeInkWh', String(kwhElecticState.currentChargeInkWh));
        } else if (
            pctElecticState.currentChargePCT &&
            vehicleParams.model &&
            'engine' in vehicleParams.model &&
            vehicleParams.model.engine
        ) {
            const engine = vehicleParams.model.engine;
            const maxChargeKWH = engine.charging?.maxChargeKWH;
            if (maxChargeKWH) {
                // currentChargePCT needs maxChargeKWH to be converted to kWh
                urlParams.append('currentChargeInkWh', String((maxChargeKWH * pctElecticState.currentChargePCT) / 100));
            }
        }
    }
};

const appendVehiclePreferences = (urlParams: URLSearchParams, vehicleParams: VehicleParameters): void => {
    if (!vehicleParams.preferences) {
        return;
    }

    if ('engineType' in vehicleParams && vehicleParams.engineType === 'electric') {
        const preferences = vehicleParams.preferences;
        if (preferences.chargingPreferences) {
            const chargingPrefs = preferences.chargingPreferences;
            const kwhChargingPrefs = chargingPrefs as ChargingPreferencesKWH;
            const pctChargingPrefs = chargingPrefs as ChargingPreferencesPCT;

            // Check if absolute kWh values are available and use them directly
            if (kwhChargingPrefs.minChargeAtChargingStopsInkWh || kwhChargingPrefs.minChargeAtDestinationInkWh) {
                urlParams.append('minChargeAtDestinationInkWh', String(kwhChargingPrefs.minChargeAtDestinationInkWh));
                urlParams.append(
                    'minChargeAtChargingStopsInkWh',
                    String(kwhChargingPrefs.minChargeAtChargingStopsInkWh),
                );
            } else if (
                (pctChargingPrefs.minChargeAtChargingStopsPCT || pctChargingPrefs.minChargeAtDestinationPCT) &&
                vehicleParams.model &&
                'engine' in vehicleParams.model &&
                vehicleParams.model.engine
            ) {
                // Considering percentage values if absolute values not available and maxChargeKWH exists
                const engine = vehicleParams.model.engine;
                const maxChargeKWH = engine.charging?.maxChargeKWH;
                if (maxChargeKWH) {
                    urlParams.append(
                        'minChargeAtDestinationInkWh',
                        String((maxChargeKWH * pctChargingPrefs.minChargeAtDestinationPCT) / 100),
                    );
                    urlParams.append(
                        'minChargeAtChargingStopsInkWh',
                        String((maxChargeKWH * pctChargingPrefs.minChargeAtChargingStopsPCT) / 100),
                    );
                }
            }
        }
    }
};

const appendVehicleDimensions = (urlParams: URLSearchParams, dimensions?: VehicleDimensions): void => {
    if (dimensions) {
        // (defaults are 0):
        dimensions.lengthMeters && urlParams.append('vehicleLength', String(dimensions.lengthMeters));
        dimensions.heightMeters && urlParams.append('vehicleHeight', String(dimensions.heightMeters));
        dimensions.widthMeters && urlParams.append('vehicleWidth', String(dimensions.widthMeters));
        dimensions.weightKG && urlParams.append('vehicleWeight', String(dimensions.weightKG));
        dimensions.axleWeightKG && urlParams.append('vehicleAxleWeight', String(dimensions.axleWeightKG));
    }
};

const appendVehicleRestrictions = (urlParams: URLSearchParams, vehicleParams: VehicleParameters): void => {
    // Vehicle restrictions from VehicleRestrictions intersection:
    const restrictions = vehicleParams.restrictions;
    if (!restrictions) {
        return;
    }

    appendByRepeatingParamName(urlParams, 'vehicleLoadType', restrictions.loadTypes);
    restrictions.adrCode && urlParams.append('vehicleAdrTunnelRestrictionCode', restrictions.adrCode);
    restrictions.commercial && urlParams.append('vehicleCommercial', String(restrictions.commercial));
    // (default is 0):
    restrictions.maxSpeedKMH && urlParams.append('vehicleMaxSpeed', String(restrictions.maxSpeedKMH));
};

const appendVehicleEngineModel = (
    urlParams: URLSearchParams,
    engineType: VehicleEngineType,
    engine: VehicleEngineModel<VehicleEngineType>,
): void => {
    // (efficiency params have the same names between engine types)
    appendConsumptionEfficiency(urlParams, engine.consumption.efficiency);

    if (engineType === 'electric') {
        appendElectricConsumptionModel(urlParams, (engine as ElectricEngineModel).consumption);
        appendChargingModel(urlParams, engine as ElectricEngineModel);
    } else {
        // (no need to append combustion vehicleEngineType since it's the default)
        appendCombustionEngine(urlParams, engine as CombustionEngineModel);
    }
};

const appendVehicleModel = (urlParams: URLSearchParams, vehicleParams: VehicleParameters): void => {
    if (!vehicleParams.model) {
        return;
    }

    // Handle predefined vehicle model
    if ('variantId' in vehicleParams.model) {
        urlParams.append('vehicleModelId', vehicleParams.model.variantId);
    } else {
        // Handle explicit vehicle model (dimensions and engine)
        appendVehicleDimensions(urlParams, vehicleParams.model.dimensions);

        if (vehicleParams.model.engine) {
            appendVehicleEngineModel(
                urlParams,
                'engineType' in vehicleParams ? vehicleParams.engineType : undefined,
                vehicleParams.model.engine,
            );
        }
    }
};

/**
 * Appends vehicle parameters to the URL search params for routing requests.
 * @param urlParams - The URLSearchParams to append to
 * @param vehicleParams - The vehicle parameters to append
 */
export const appendVehicleParams = (urlParams: URLSearchParams, vehicleParams?: VehicleParameters): void => {
    if (!vehicleParams) {
        return;
    }

    // the engine type defaults to combustion, thus we only bother to append it if it's electric:
    if ((vehicleParams as ElectricVehicleParams).engineType === 'electric') {
        urlParams.append('vehicleEngineType', 'electric');
    }

    appendVehicleModel(urlParams, vehicleParams);
    appendVehicleState(urlParams, vehicleParams);
    appendVehiclePreferences(urlParams, vehicleParams);
    appendVehicleRestrictions(urlParams, vehicleParams);
};
