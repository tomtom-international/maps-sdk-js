import { Geometries } from "@anw/maps-sdk-js/core";
import { ServiceTemplate } from "../shared";
import { GeometryDataResponseAPI } from "./types/apiTypes";
import { GeometryParams } from "./types/geometryDataParams";
import { buildGeometryDataRequest } from "./requestBuilder";
import { get } from "../shared/fetch";
import { parseGeometryDataResponse } from "./responseParser";
import { geometryDataRequestSchema } from "./geometryDataRequestSchema";

export type GeometryDataTemplate = ServiceTemplate<GeometryParams, URL, GeometryDataResponseAPI, Geometries>;

export const geometryDataTemplate: GeometryDataTemplate = {
    requestValidation: { schema: geometryDataRequestSchema },
    buildRequest: buildGeometryDataRequest,
    sendRequest: get,
    parseResponse: parseGeometryDataResponse
};
