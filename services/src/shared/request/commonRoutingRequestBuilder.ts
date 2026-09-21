import type { CommonRoutingParams, DepartArriveParams } from '../types/commonRoutingParams';
import { appendByRepeatingParamName, appendOptionalParam } from './requestBuildingUtils';
import { appendVehicleParams } from './routingVehicleParamsBuilder';

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

/**
 * @ignore
 */
export const appendCommonRoutingParams = (urlParams: URLSearchParams, params: CommonRoutingParams): void => {
    const costModel = params.costModel;
    appendByRepeatingParamName(urlParams, 'avoid', costModel?.avoid);
    appendOptionalParam(urlParams, 'traffic', costModel?.traffic);
    appendWhenParams(urlParams, params.when);
    appendOptionalParam(urlParams, 'routeType', costModel?.routeType);
    appendOptionalParam(urlParams, 'travelMode', params.travelMode);
    appendVehicleParams(urlParams, params.vehicle);
};
