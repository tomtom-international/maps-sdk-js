import { appendByRepeatingParamName, appendOptionalParam } from './requestBuildingUtils';
import { appendVehicleParams } from './routingVehicleParamsBuilder';
import type { CommonRoutingParams, DepartArriveParams } from './types/commonRoutingParams';

const appendWhenParams = (urlParams: URLSearchParams, when?: DepartArriveParams): void => {
    if (when?.date) {
        const formattedDate = when.date.toISOString();
        if (when.option === 'departAt') {
            urlParams.append('departAt', formattedDate);
        } else if (when.option === 'arriveBy') {
            urlParams.append('arriveAt', formattedDate);
        }
    }
};

// TODO: not supported yet in Orbis
// const appendThrillingParams = (urlParams: URLSearchParams, thrillingParams?: ThrillingParams): void => {
//     if (thrillingParams) {
//         thrillingParams.hilliness && urlParams.append('hilliness', thrillingParams.hilliness);
//         thrillingParams.windingness && urlParams.append('windingness', thrillingParams.windingness);
//     }
// };

/**
 * @ignore
 */
export const appendCommonRoutingParams = (urlParams: URLSearchParams, params: CommonRoutingParams): void => {
    const costModel = params.costModel;
    appendByRepeatingParamName(urlParams, 'avoid', costModel?.avoid);
    appendOptionalParam(urlParams, 'traffic', costModel?.traffic);
    appendWhenParams(urlParams, params.when);
    appendOptionalParam(urlParams, 'routeType', costModel?.routeType);
    // TODO not supported in Orbis
    // if (costModel?.routeType === 'thrilling') {
    //     appendThrillingParams(urlParams, costModel.thrillingParams);
    // }
    appendOptionalParam(urlParams, 'travelMode', params.travelMode);
    appendVehicleParams(urlParams, params.vehicle);
};
