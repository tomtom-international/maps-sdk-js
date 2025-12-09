import type { CalculateRouteTemplate } from './calculateRouteTemplate';
import { calculateRouteTemplate } from './calculateRouteTemplate';
import { buildCalculateRouteRequest } from './requestBuilder';
import { parseCalculateRouteResponse } from './responseParser';

const customize: {
    buildCalculateRouteRequest: typeof buildCalculateRouteRequest;
    parseCalculateRouteResponse: typeof parseCalculateRouteResponse;
    calculateRouteTemplate: CalculateRouteTemplate;
} = {
    buildCalculateRouteRequest,
    parseCalculateRouteResponse,
    calculateRouteTemplate,
};
export default customize;
