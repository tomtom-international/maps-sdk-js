import { Routes } from "@anw/go-sdk-js/core";
import { ServiceTemplate } from "../shared";
import { CalculateRouteParams } from "./types/CalculateRouteParams";
import { buildCalculateRouteRequest } from "./RequestBuilder";
import { parseCalculateRouteResponse } from "./ResponseParser";
import { fetchWith } from "../shared/Fetch";
import { FetchInput } from "../shared/types/Fetch";
import { CalculateRouteResponseAPI } from "./types/APIResponseTypes";
import { parseRoutingResponseError } from "./RoutingResponseErrorParser";
import { calculateRouteRequestSchema, calculateRouteGeoInputsRefinement } from "./CalculateRouteRequestSchema";
import { CalculateRoutePOSTDataAPI } from "./types/APIPOSTRequestTypes";

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
