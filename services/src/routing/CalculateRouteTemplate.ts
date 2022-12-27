import { Routes } from "@anw/go-sdk-js/core";
import { ServiceTemplate } from "../shared";
import { CalculateRouteParams } from "./types/CalculateRouteParams";
import { buildCalculateRouteRequest } from "./RequestBuilder";
import { parseCalculateRouteResponse } from "./ResponseParser";
import { get } from "../shared/Fetch";
import { CalculateRouteResponseAPI } from "./types/APITypes";
import { parseRoutingResponseError } from "./RoutingResponseErrorParser";
import { calculateRouteRequestSchema } from "./CalculateRouteRequestSchema";

/**
 * @group Calculate Route
 * @category Types
 */
export type CalculateRouteTemplate = ServiceTemplate<CalculateRouteParams, URL, CalculateRouteResponseAPI, Routes>;

/**
 * @group Calculate Route
 * @category Variables
 */
export const calculateRouteTemplate: CalculateRouteTemplate = {
    buildRequest: buildCalculateRouteRequest,
    sendRequest: get,
    parseResponse: parseCalculateRouteResponse,
    parseResponseError: parseRoutingResponseError,
    validateRequestSchema: calculateRouteRequestSchema
};
