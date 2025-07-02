import { buildCalculateRouteRequest } from './requestBuilder';
import { parseCalculateRouteResponse } from './responseParser';
import { calculateRouteTemplate } from './calculateRouteTemplate';

const customize = {
    buildCalculateRouteRequest,
    parseCalculateRouteResponse,
    calculateRouteTemplate,
};
export default customize;
