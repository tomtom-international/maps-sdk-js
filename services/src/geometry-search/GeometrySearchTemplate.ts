import { parseGeometrySearchResponse } from "./ResponseParser";
import { buildGeometrySearchRequest } from "./RequestBuilder";
import { postJson, PostObject } from "../shared/Fetch";
import { ServiceTemplate } from "../shared/ServiceTypes";
import {
    GeometrySearchParams,
    GeometrySearchResponse,
    GeometrySearchResponseAPI,
    SearchByGeometryPayloadAPI
} from "./types";
import { geometrySearchRequestSchema } from "./GeometrySearchRequestSchema";

/**
 * Geometry search service template type.
 */
export type GeometrySearchTemplate = ServiceTemplate<
    GeometrySearchParams,
    PostObject<SearchByGeometryPayloadAPI>,
    GeometrySearchResponseAPI,
    GeometrySearchResponse
>;

/**
 * Geometry search service template main implementation.
 */
export const geometrySearchTemplate: GeometrySearchTemplate = {
    validateRequestSchema: geometrySearchRequestSchema,
    buildRequest: buildGeometrySearchRequest,
    sendRequest: postJson,
    parseResponse: parseGeometrySearchResponse
};
