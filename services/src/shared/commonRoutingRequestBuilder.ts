// import isNil from "lodash/isNil";
import { appendByRepeatingParamName, appendOptionalParam } from "./requestBuildingUtils";
import {
    CommonEVRoutingParams,
    CommonRoutingParams /*DepartArriveParams, ThrillingParams*/
} from "./types/commonRoutingParams";

// TODO lot of functionality is not supported in Orbis but it may be supported in the future
// import {
//     ChargingPreferences,
//     CombustionVehicleEngine,
//     ConsumptionModelEfficiency,
//     ElectricConsumptionModel,
//     ElectricVehicleEngine,
//     SpeedToConsumptionRate,
//     VehicleEngine
// } from "./types/vehicleEngineParams";
// import { VehicleDimensions, VehicleParameters } from "./types/vehicleParams";

// const appendWhenParams = (urlParams: URLSearchParams, when?: DepartArriveParams): void => {
//     if (when?.date) {
//         const formattedDate = when.date.toISOString();
//         if (when.option == "departAt") {
//             urlParams.append("departAt", formattedDate);
//         } else if (when.option == "arriveBy") {
//             urlParams.append("arriveAt", formattedDate);
//         }
//     }
// };

// const appendThrillingParams = (urlParams: URLSearchParams, thrillingParams?: ThrillingParams): void => {
//     if (thrillingParams) {
//         thrillingParams.hilliness && urlParams.append("hilliness", thrillingParams.hilliness);
//         thrillingParams.windingness && urlParams.append("windingness", thrillingParams.windingness);
//     }
// };

// const appendConsumptionEfficiency = (urlParams: URLSearchParams, efficiency?: ConsumptionModelEfficiency): void => {
//     if (efficiency) {
//         !isNil(efficiency.acceleration) && urlParams.append("accelerationEfficiency", String(efficiency.acceleration));
//         !isNil(efficiency.deceleration) && urlParams.append("decelerationEfficiency", String(efficiency.deceleration));
//         !isNil(efficiency.uphill) && urlParams.append("uphillEfficiency", String(efficiency.uphill));
//         !isNil(efficiency.downhill) && urlParams.append("downhillEfficiency", String(efficiency.downhill));
//     }
// };

// e.g. 50,6.3:130,11.5
// const buildSpeedToConsumptionString = (speedsToConsumptions: SpeedToConsumptionRate[]): string =>
//     speedsToConsumptions
//         .map((speedToConsumption) => `${speedToConsumption.speedKMH},${speedToConsumption.consumptionUnitsPer100KM}`)
//         .join(":");

// const appendCombustionEngine = (urlParams: URLSearchParams, engine: CombustionVehicleEngine): void => {
//     // (no need to append combustion vehicleEngineType since it's the default)
//     const consumptionModel = engine.model.consumption;
//     consumptionModel.speedsToConsumptionsLiters &&
//         urlParams.append(
//             "constantSpeedConsumptionInLitersPerHundredkm",
//             buildSpeedToConsumptionString(consumptionModel.speedsToConsumptionsLiters)
//         );
//     !isNil(consumptionModel.auxiliaryPowerInLitersPerHour) &&
//         urlParams.append("auxiliaryPowerInLitersPerHour", String(consumptionModel.auxiliaryPowerInLitersPerHour));
//     !isNil(consumptionModel.fuelEnergyDensityInMJoulesPerLiter) &&
//         urlParams.append(
//             "fuelEnergyDensityInMJoulesPerLiter",
//             String(consumptionModel.fuelEnergyDensityInMJoulesPerLiter)
//         );
//     engine.currentFuelInLiters && urlParams.append("currentFuelInLiters", String(engine.currentFuelInLiters));
// };

// const appendElectricConsumptionModel = (urlParams: URLSearchParams, model: ElectricConsumptionModel): void => {
//     model.speedsToConsumptionsKWH &&
//         urlParams.append(
//             "constantSpeedConsumptionInkWhPerHundredkm",
//             buildSpeedToConsumptionString(model.speedsToConsumptionsKWH)
//         );
//     !isNil(model.auxiliaryPowerInkW) && urlParams.append("auxiliaryPowerInkW", String(model.auxiliaryPowerInkW));
//     !isNil(model.consumptionInKWHPerKMAltitudeGain) &&
//         urlParams.append("consumptionInkWhPerkmAltitudeGain", String(model.consumptionInKWHPerKMAltitudeGain));
//     !isNil(model.recuperationInKWHPerKMAltitudeLoss) &&
//         urlParams.append("recuperationInkWhPerkmAltitudeLoss", String(model.recuperationInKWHPerKMAltitudeLoss));
// };

// const appendChargingPreferences = (
//     urlParams: URLSearchParams,
//     preferences: ChargingPreferences | undefined,
//     maxChargeKWH: number
// ): void => {
//     if (!preferences) {
//         return;
//     }
//     urlParams.append(
//         "minChargeAtDestinationInkWh",
//         String((maxChargeKWH * preferences.minChargeAtDestinationPCT) / 100)
//     );
//     urlParams.append(
//         "minChargeAtChargingStopsInkWh",
//         String((maxChargeKWH * preferences.minChargeAtChargingStopsPCT) / 100)
//     );
// };

// const appendElectricCharging = (urlParams: URLSearchParams, engine: ElectricVehicleEngine): void => {
//     const chargingModel = engine.model.charging;
//     if (chargingModel?.maxChargeKWH) {
//         urlParams.append("maxChargeInkWh", String(chargingModel.maxChargeKWH));
//         engine.currentChargePCT &&
//             urlParams.append(
//                 "currentChargeInkWh",
//                 String((chargingModel.maxChargeKWH * engine.currentChargePCT) / 100)
//             );
//         appendChargingPreferences(urlParams, engine.chargingPreferences, chargingModel.maxChargeKWH);
//     }
//     // (the rest of the charging model goes as POST data)
// };

// const appendElectricEngine = (urlParams: URLSearchParams, engine: ElectricVehicleEngine): void => {
//     urlParams.append("vehicleEngineType", "electric");
//     appendElectricConsumptionModel(urlParams, engine.model.consumption);
//     appendElectricCharging(urlParams, engine);
// };

// const appendVehicleEngine = (urlParams: URLSearchParams, engine?: VehicleEngine): void => {
//     if (engine) {
//         // (efficiency params have the same names between engine types)
//         appendConsumptionEfficiency(urlParams, engine.model.consumption.efficiency);
//         if (engine.type === "electric") {
//             appendElectricEngine(urlParams, engine);
//         } else {
//             appendCombustionEngine(urlParams, engine);
//         }
//     }
// };

// const appendVehicleDimensions = (urlParams: URLSearchParams, dimensions?: VehicleDimensions): void => {
//     if (dimensions) {
//         // (defaults are 0):
//         dimensions.lengthMeters && urlParams.append("vehicleLength", String(dimensions.lengthMeters));
//         dimensions.heightMeters && urlParams.append("vehicleHeight", String(dimensions.heightMeters));
//         dimensions.widthMeters && urlParams.append("vehicleWidth", String(dimensions.widthMeters));
//         dimensions.weightKG && urlParams.append("vehicleWeight", String(dimensions.weightKG));
//         dimensions.axleWeightKG && urlParams.append("vehicleAxleWeight", String(dimensions.axleWeightKG));
//     }
// };

// const appendVehicleParams = (urlParams: URLSearchParams, vehicleParams?: VehicleParameters): void => {
//     if (vehicleParams) {
//         appendVehicleEngine(urlParams, vehicleParams.engine);
//         appendVehicleDimensions(urlParams, vehicleParams.dimensions);
//         appendByRepeatingParamName(urlParams, "vehicleLoadType", vehicleParams.loadTypes);
//         vehicleParams.adrCode && urlParams.append("vehicleAdrTunnelRestrictionCode", vehicleParams.adrCode);
//         vehicleParams.commercial && urlParams.append("vehicleCommercial", String(vehicleParams.commercial));
//         // (default is 0):
//         vehicleParams.maxSpeedKMH && urlParams.append("vehicleMaxSpeed", String(vehicleParams.maxSpeedKMH));
//     }
// };

const appendEVParams = (urlParams: URLSearchParams, evRoutingParams?: CommonEVRoutingParams): void => {
    if (evRoutingParams) {
        urlParams.append("vehicleEngineType", evRoutingParams.vehicleEngineType);
        urlParams.append("currentChargeInkWh", String(evRoutingParams.currentChargeInkWh));
        urlParams.append("minChargeAtDestinationInkWh", String(evRoutingParams.minChargeAtDestinationInkWh));
        urlParams.append("minChargeAtChargingStopsInkWh", String(evRoutingParams.minChargeAtChargingStopsInkWh));
        urlParams.append("vehicleModelId", evRoutingParams.vehicleModelId);
        evRoutingParams.minDeviationDistance &&
            urlParams.append("minDeviationDistance", String(evRoutingParams.minDeviationDistance));
        evRoutingParams.minDeviationTime &&
            urlParams.append("minDeviationTime", String(evRoutingParams.minDeviationTime));
        evRoutingParams.supportingPointIndexOfOrigin &&
            urlParams.append("supportingPointIndexOfOrigin", String(evRoutingParams.supportingPointIndexOfOrigin));
        evRoutingParams.alternativeType && urlParams.append("alternativeType", evRoutingParams.alternativeType);
    }
};

/**
 * @ignore
 */
export const appendCommonRoutingParams = (urlParams: URLSearchParams, params: CommonRoutingParams): void => {
    const costModel = params.costModel;
    appendByRepeatingParamName(urlParams, "avoid", costModel?.avoid);
    appendOptionalParam(urlParams, "traffic", costModel?.considerTraffic);
    // appendWhenParams(urlParams, params.when);
    appendOptionalParam(urlParams, "routeType", costModel?.routeType);
    appendOptionalParam(urlParams, "travelMode", params.travelMode);
    if (costModel?.routeType == "thrilling") {
        // appendThrillingParams(urlParams, costModel.thrillingParams);
    }
    appendEVParams(urlParams, params.commonEVRoutingParams);
};
