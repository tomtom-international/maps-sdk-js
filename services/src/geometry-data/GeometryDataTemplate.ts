import { ServiceTemplate } from "../shared/ServiceTypes";
import { GeometryDataResponseAPI } from "./types/APITypes";
import { GeometryDataResponse } from "./types/GeometryDataResponse";
import { GeometryDataParams } from "./types/GeometryDataParams";
import { buildGeometryDataRequest } from "./RequestBuilder";
import { getJson } from "../shared/Fetch";
import { parseGeometryDataResponse } from "./ResponseParser";
import { geometryDataRequestSchema } from "./GeometryDataRequestSchema";

export type GeometryDataTemplate = ServiceTemplate<
    GeometryDataParams,
    URL,
    GeometryDataResponseAPI,
    GeometryDataResponse
>;

export const geometryDataTemplate: GeometryDataTemplate = {
    validateRequestSchema: geometryDataRequestSchema,
    buildRequest: buildGeometryDataRequest,
    sendRequest: getJson,
    parseResponse: parseGeometryDataResponse
};
