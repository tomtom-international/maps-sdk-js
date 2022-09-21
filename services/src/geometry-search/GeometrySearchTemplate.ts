import { parseGeometrySearchResponse } from "./ResponseParser";
import { buildGeometrySearchRequest } from "./RequestBuilder";
import { postJson, PostObject } from "../shared/Fetch";
import { ServiceTemplate } from "../shared/ServiceTypes";
import {
    GeometrySearchRequest,
    GeometrySearchResponse,
    GeometrySearchResponseAPI,
    SearchByGeometryPayloadAPI
} from "./types";
import { geometrySearchRequestSchema } from "./GeometrySearchRequestSchema";

/**
 * Geocoding service template type.
 */
export type GeometrySearchTemplate = ServiceTemplate<
    GeometrySearchRequest,
    PostObject<SearchByGeometryPayloadAPI>,
    GeometrySearchResponseAPI,
    GeometrySearchResponse
>;

/**
 * Geocoding service template main implementation.
 */
export const geometrySearchTemplate: GeometrySearchTemplate = {
    buildRequest: buildGeometrySearchRequest,
    sendRequest: postJson,
    parseResponse: parseGeometrySearchResponse,
    validateRequestSchema: geometrySearchRequestSchema
};
