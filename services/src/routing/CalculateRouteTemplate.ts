import { ServiceTemplate } from "../shared/ServiceTypes";
import { CalculateRouteParams } from "./types/CalculateRouteParams";
import { CalculateRouteResponse } from "./CalculateRoute";
import { buildCalculateRouteRequest } from "./RequestBuilder";
import { parseCalculateRouteResponse } from "./ResponseParser";
import { getJson } from "../shared/Fetch";
import { APICalculateRouteResult } from "./types/APITypes";

export type CalculateRouteTemplate = ServiceTemplate<
    CalculateRouteParams,
    URL,
    APICalculateRouteResult,
    CalculateRouteResponse
>;

export const calculateRouteTemplate: CalculateRouteTemplate = {
    buildRequest: buildCalculateRouteRequest,
    sendRequest: getJson,
    parseResponse: parseCalculateRouteResponse
};
