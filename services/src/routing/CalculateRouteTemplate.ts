import { ServiceTemplate } from "../shared";
import { CalculateRouteParams } from "./types/CalculateRouteParams";
import { CalculateRouteResponse } from "./CalculateRoute";
import { buildCalculateRouteRequest } from "./RequestBuilder";
import { parseCalculateRouteResponse } from "./ResponseParser";
import { getJson } from "../shared/Fetch";
import { CalculateRouteResponseAPI } from "./types/APITypes";
import { parseRoutingResponseError } from "./RoutingResponseErrorParser";
import { calculateRouteRequestSchema } from "./CalculateRouteRequestSchema";

/**
 * @group Calculate Route
 * @category Types
 */
export type CalculateRouteTemplate = ServiceTemplate<
    CalculateRouteParams,
    URL,
    CalculateRouteResponseAPI,
    CalculateRouteResponse
>;

/**
 * @group Calculate Route
 * @category Variables
 */
export const calculateRouteTemplate: CalculateRouteTemplate = {
    buildRequest: buildCalculateRouteRequest,
    sendRequest: getJson,
    parseResponse: parseCalculateRouteResponse,
    parseResponseError: parseRoutingResponseError,
    validateRequestSchema: calculateRouteRequestSchema
};
