import { getPositionStrict } from '@tomtom-org/maps-sdk/core';
import type { Position } from 'geojson';
import type { FetchInput } from '../shared';
import { appendCommonRoutingParams } from '../shared/request/commonRoutingRequestBuilder';
import { appendCommonParams, appendOptionalParam } from '../shared/request/requestBuildingUtils';
import type { ElectricVehicleParams } from '../shared/types/vehicleParams';
import type { ElectricVehicleStatePCT } from '../shared/types/vehicleState';
import type { ReachableRangePostData } from './types/apiRequestTypes';
import type { ReachableRangeParams } from './types/reachableRangeParams';

const buildUrlBasePath = (params: ReachableRangeParams): string =>
    params.customServiceBaseURL ?? `${params.commonBaseURL}/maps/orbis/routing/calculateReachableRange`;

const getMaxChargeKWH = (params: ReachableRangeParams): number | undefined => {
    const vehicle = params.vehicle as ElectricVehicleParams | undefined;
    if (!vehicle?.model || !('engine' in vehicle.model)) {
        return undefined;
    }
    return vehicle.model.engine?.charging?.maxChargeKWH;
};

const getCurrentChargeKWH = (params: ReachableRangeParams): number | undefined => {
    const vehicle = params.vehicle as ElectricVehicleParams | undefined;
    if (!vehicle?.state) {
        return undefined;
    }
    const pctState = vehicle.state as ElectricVehicleStatePCT;
    if (pctState.currentChargePCT != null) {
        const maxChargeKWH = getMaxChargeKWH(params);
        if (maxChargeKWH != null) {
            return (maxChargeKWH * pctState.currentChargePCT) / 100;
        }
    }
    return undefined;
};

const appendBudget = (urlParams: URLSearchParams, params: ReachableRangeParams): void => {
    const budget = params.budget;
    switch (budget.type) {
        case 'timeMinutes':
            urlParams.append('timeBudgetInSec', (budget.value * 60).toString());
            break;
        case 'distanceKM':
            urlParams.append('distanceBudgetInMeters', (budget.value * 1000).toString());
            break;
        case 'spentFuelLiters':
            urlParams.append('fuelBudgetInLiters', budget.value.toString());
            break;
        case 'spentChargePCT': {
            const maxChargeKWH = getMaxChargeKWH(params);
            if (maxChargeKWH != null) {
                urlParams.append('energyBudgetInkWh', ((maxChargeKWH * budget.value) / 100).toString());
            }
            break;
        }
        case 'remainingChargeCPT': {
            const currentChargeKWH = getCurrentChargeKWH(params);
            const maxChargeKWH = getMaxChargeKWH(params);
            if (maxChargeKWH != null && currentChargeKWH != null) {
                const remainingKWH = (maxChargeKWH * budget.value) / 100;
                urlParams.append('energyBudgetInkWh', Math.max(0, currentChargeKWH - remainingKWH).toString());
            }
            break;
        }
        default:
            // Unsupported by SDK but will attempt to send it anyway
            urlParams.append(budget.type, budget.value.toString());
    }
};

const buildPostData = (params: ReachableRangeParams): ReachableRangePostData => {
    const position: Position = getPositionStrict(params.origin);
    return {
        origin: { type: 'Point', coordinates: [position[0], position[1]] },
    };
};

/**
 * @param params
 * @returns
 */
export const buildReachableRangeRequest = (params: ReachableRangeParams): FetchInput<ReachableRangePostData> => {
    const url = new URL(buildUrlBasePath(params));
    const urlParams = url.searchParams;
    appendCommonParams(urlParams, params);
    // Currently reachable range API does not support language: https://developer.tomtom.com/routing-api/documentation/tomtom-orbis-maps/v3/calculate-reachable-range
    urlParams.delete('language');
    appendCommonRoutingParams(urlParams, params);
    appendBudget(urlParams, params);
    appendOptionalParam(urlParams, 'maxFerryLengthInMeters', params.maxFerryLengthMeters);
    appendOptionalParam(urlParams, 'smoothing', params.smoothing ?? 'strong');
    return { method: 'POST', url, data: buildPostData(params) };
};
