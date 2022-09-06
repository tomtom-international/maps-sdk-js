import { buildCalculateRouteRequest } from "./RequestBuilder";
import { parseCalculateRouteResponse } from "./ResponseParser";
import { calculateRouteTemplate } from "./CalculateRouteTemplate";

const customize = {
    buildCalculateRouteRequest,
    parseCalculateRouteResponse,
    calculateRouteTemplate
};
export default customize;
