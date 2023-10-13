import { positionToCSVLatLon } from "../shared/geometry";
import { appendCommonParams, appendOptionalParam } from "../shared/requestBuildingUtils";
import { ReachableRangeParams } from "./types/reachableRangeParams";
import { appendCommonRoutingParams } from "../shared/commonRoutingRequestBuilder";
import { getLngLatArray } from "@anw/maps-sdk-js/core";
import { ElectricVehicleEngine } from "../shared/types/vehicleEngineParams";

const buildURLBasePath = (params: ReachableRangeParams): string =>
    params.customServiceBaseURL ||
    `${params.commonBaseURL}/routing/1/calculateReachableRange/${positionToCSVLatLon(
        getLngLatArray(params.origin)
    )}/json`;

const toKWH = (chargePCT: number, engine: ElectricVehicleEngine): number =>
    (engine.model.charging?.maxChargeKWH as number) * (chargePCT / 100);

const toRemainingKWH = (remainingChargeCPT: number, engine: ElectricVehicleEngine): number => {
    const maxChargeKWH = engine.model.charging?.maxChargeKWH as number;
    const currentChargeKWH = maxChargeKWH * (engine.currentChargePCT / 100);
    return currentChargeKWH - maxChargeKWH * (remainingChargeCPT / 100);
};

const appendBudget = (urlParams: URLSearchParams, params: ReachableRangeParams): void => {
    const budget = params.budget;
    switch (budget.type) {
        case "timeMinutes":
            urlParams.append("timeBudgetInSec", (budget.value * 60).toString());
            break;
        case "remainingChargeCPT":
            urlParams.append(
                "energyBudgetInkWh",
                toRemainingKWH(budget.value, params.vehicle?.engine as ElectricVehicleEngine).toString()
            );
            break;
        case "spentChargePCT":
            urlParams.append(
                "energyBudgetInkWh",
                toKWH(budget.value, params.vehicle?.engine as ElectricVehicleEngine).toString()
            );
            break;
        case "spentFuelLiters":
            urlParams.append("fuelBudgetInLiters", budget.value.toString());
            break;
        case "distanceKM":
            urlParams.append("distanceBudgetInMeters", (budget.value * 1000).toString());
            break;
        default:
            // Unsupported by SDK but will attempt to send it anyway (most likely will fail API-side)
            urlParams.append(budget.type, budget.value.toString());
    }
};

/**
 *
 * @param params
 * @returns
 */
export const buildReachableRangeRequest = (params: ReachableRangeParams): URL => {
    const url = new URL(buildURLBasePath(params));
    const urlParams = url.searchParams;
    appendCommonParams(urlParams, params);
    appendCommonRoutingParams(urlParams, params);
    appendBudget(urlParams, params);
    appendOptionalParam(urlParams, "maxFerryLengthInMeters", params.maxFerryLengthMeters);
    return url;
};
