import { calculateRouteTemplate } from './calculateRouteTemplate';
import { buildCalculateRouteRequest } from './requestBuilder';
import { parseCalculateRouteResponse } from './responseParser';

const customize = {
    buildCalculateRouteRequest,
    parseCalculateRouteResponse,
    calculateRouteTemplate,
};
export default customize;
