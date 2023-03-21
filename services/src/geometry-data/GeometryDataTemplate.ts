import { GeometryDataResponse } from "@anw/maps-sdk-js/core";
import { ServiceTemplate } from "../shared";
import { GeometryDataResponseAPI } from "./types/APITypes";
import { GeometryDataParams } from "./types/GeometryDataParams";
import { buildGeometryDataRequest } from "./RequestBuilder";
import { get } from "../shared/Fetch";
import { parseGeometryDataResponse } from "./ResponseParser";
import { geometryDataRequestSchema } from "./GeometryDataRequestSchema";

export type GeometryDataTemplate = ServiceTemplate<
    GeometryDataParams,
    URL,
    GeometryDataResponseAPI,
    GeometryDataResponse
>;

export const geometryDataTemplate: GeometryDataTemplate = {
    requestValidation: { schema: geometryDataRequestSchema },
    buildRequest: buildGeometryDataRequest,
    sendRequest: get,
    parseResponse: parseGeometryDataResponse
};
