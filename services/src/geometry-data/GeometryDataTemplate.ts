import { GeometryData } from "@anw/go-sdk-js/core";
import { ServiceTemplate } from "../shared/ServiceTypes";
import { GeometryDataResponseAPI } from "./types/APITypes";
import { GeometryDataParams } from "./types/GeometryDataParams";
import { buildGeometryDataRequest } from "./RequestBuilder";
import { getJson } from "../shared/Fetch";
import { parseGeometryDataResponse } from "./ResponseParser";
import { geometryDataRequestSchema } from "./GeometryDataRequestSchema";

/**
 * @group Geometry Data
 * @category Types
 */
export type GeometryDataTemplate = ServiceTemplate<GeometryDataParams, URL, GeometryDataResponseAPI, GeometryData>;

/**
 * @group Geometry Data
 * @category Variables
 */
export const geometryDataTemplate: GeometryDataTemplate = {
    validateRequestSchema: geometryDataRequestSchema,
    buildRequest: buildGeometryDataRequest,
    sendRequest: getJson,
    parseResponse: parseGeometryDataResponse
};
