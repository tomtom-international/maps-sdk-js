import { Routes } from "@anw/maps-sdk-js/core";
import { ServiceTemplate } from "../shared";
import { CalculateRouteParams } from "./types/calculateRouteParams";
import { buildCalculateRouteRequest } from "./requestBuilder";
import { parseCalculateRouteResponse } from "./responseParser";
import { fetchWith } from "../shared/fetch";
import { FetchInput } from "../shared/types/fetch";
import { CalculateRouteResponseAPI } from "./types/apiResponseTypes";
import { parseRoutingResponseError } from "./routingResponseErrorParser";
import { routeRequestValidationConfig } from "./calculateRouteRequestSchema";
import { CalculateRoutePOSTDataAPI } from "./types/apiRequestTypes";

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
    parseResponseError: parseRoutingResponseError
};
