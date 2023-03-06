import { parseGeometrySearchResponse } from "./ResponseParser";
import { buildGeometrySearchRequest } from "./RequestBuilder";
import { post, PostObject } from "../shared/Fetch";
import { ServiceTemplate } from "../shared";
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
    requestValidation: { schema: geometrySearchRequestSchema },
    buildRequest: buildGeometrySearchRequest,
    sendRequest: post,
    parseResponse: parseGeometrySearchResponse
};
