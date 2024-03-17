import type { PolygonFeature } from "@anw/maps-sdk-js/core";
import type { ServiceTemplate } from "../shared";
import { get } from "../shared/fetch";
import type { ReachableRangeResponseAPI } from "./types/apiResponseTypes";
import type { ReachableRangeParams } from "./types/reachableRangeParams";
import { buildReachableRangeRequest } from "./requestBuilder";
import { parseReachableRangeResponse } from "./responseParser";
import { reachableRangeRequestValidationConfig } from "./reachableRangeRequestSchema";

export type ReachableRangeTemplate = ServiceTemplate<
    ReachableRangeParams,
    URL,
    ReachableRangeResponseAPI,
    PolygonFeature<ReachableRangeParams>
>;

export const reachableRangeTemplate: ReachableRangeTemplate = {
    requestValidation: reachableRangeRequestValidationConfig,
    buildRequest: buildReachableRangeRequest,
    sendRequest: get,
    parseResponse: parseReachableRangeResponse
};
