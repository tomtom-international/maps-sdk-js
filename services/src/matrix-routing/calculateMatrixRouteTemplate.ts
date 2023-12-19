import { ServiceTemplate } from "../shared";
import { post } from "../shared/fetch";
import { FetchInput } from "../shared/types/fetch";
import { matrixRouteValidationConfig } from "./calculateMatrixRouteRequestSchema";
import { buildCalculateMatrixRouteRequest } from "./requestBuilder";
import { parseCalculateMatrixRouteResponse } from "./responseParser";
import { CalculateMatrixRoutePOSTDataAPI } from "./types/apiRequestTypes";
import { CalculateMatrixRouteResponseAPI } from "./types/apiResponseTypes";
import { CalculateMatrixRouteParams } from "./types/calculateMatrixRouteParams";

export type CalculateMatrixRouteTemplate = ServiceTemplate<
    CalculateMatrixRouteParams,
    FetchInput<CalculateMatrixRoutePOSTDataAPI>,
    CalculateMatrixRouteResponseAPI,
    CalculateMatrixRouteResponseAPI
>;

export const calculateMatrixRouteTemplate: CalculateMatrixRouteTemplate = {
    requestValidation: matrixRouteValidationConfig,
    buildRequest: buildCalculateMatrixRouteRequest,
    sendRequest: post,
    parseResponse: parseCalculateMatrixRouteResponse
};
