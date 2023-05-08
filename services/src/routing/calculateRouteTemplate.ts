import { Routes } from "@anw/maps-sdk-js/core";
import { ServiceTemplate } from "../shared";
import { CalculateRouteParams } from "./types/calculateRouteParams";
import { buildCalculateRouteRequest } from "./requestBuilder";
import { parseCalculateRouteResponse } from "./responseParser";
import { fetchWith } from "../shared/fetch";
import { FetchInput } from "../shared/types/fetch";
import { CalculateRouteResponseAPI } from "./types/apiResponseTypes";
import { parseRoutingResponseError } from "./routingResponseErrorParser";
import { calculateRouteRequestSchema, calculateRouteGeoInputsRefinement } from "./calculateRouteRequestSchema";
import { CalculateRoutePOSTDataAPI } from "./types/apiPostRequestTypes";

export type CalculateRouteTemplate = ServiceTemplate<
    CalculateRouteParams,
    FetchInput<CalculateRoutePOSTDataAPI>,
    CalculateRouteResponseAPI,
    Routes
>;

/**
 * @ignore
 */
export const routeRequestValidationConfig = {
    schema: calculateRouteRequestSchema,
    refinements: [calculateRouteGeoInputsRefinement]
};

export const calculateRouteTemplate: CalculateRouteTemplate = {
    requestValidation: routeRequestValidationConfig,
    buildRequest: buildCalculateRouteRequest,
    sendRequest: fetchWith,
    parseResponse: parseCalculateRouteResponse,
    parseResponseError: parseRoutingResponseError
};
