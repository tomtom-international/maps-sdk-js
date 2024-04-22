import type { Routes } from "@anw/maps-sdk-js/core";
import type { FetchInput, ServiceTemplate } from "../shared";
import type { CalculateRouteParams } from "./types/calculateRouteParams";
import { buildCalculateRouteRequest } from "./requestBuilder";
import { parseCalculateRouteResponse } from "./responseParser";
import { fetchWith } from "../shared/fetch";
import type { CalculateRouteResponseAPI } from "./types/apiResponseTypes";
import { parseRoutingResponseError } from "./routingResponseErrorParser";
import { routeRequestValidationConfig } from "./calculateRouteRequestSchema";
import type { CalculateRoutePOSTDataAPI } from "./types/apiRequestTypes";

export type CalculateRouteTemplate = ServiceTemplate<
    CalculateRouteParams,
    FetchInput<CalculateRoutePOSTDataAPI>,
    CalculateRouteResponseAPI,
    Routes
>;

export const calculateRouteTemplate: CalculateRouteTemplate = {
    requestValidation: routeRequestValidationConfig,
    buildRequest: buildCalculateRouteRequest,
    sendRequest: fetchWith,
    parseResponse: parseCalculateRouteResponse,
    parseResponseError: parseRoutingResponseError,
    getAPIVersion: () => 2
};
