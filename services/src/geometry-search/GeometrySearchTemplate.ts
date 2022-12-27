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
 * @group Geometry Search
 * @category Types
 */
export type GeometrySearchTemplate = ServiceTemplate<
    GeometrySearchParams,
    PostObject<SearchByGeometryPayloadAPI>,
    GeometrySearchResponseAPI,
    GeometrySearchResponse
>;

/**
 * Geometry search service template main implementation.
 * @group Geometry Search
 * @category Variables
 */
export const geometrySearchTemplate: GeometrySearchTemplate = {
    validateRequestSchema: geometrySearchRequestSchema,
    buildRequest: buildGeometrySearchRequest,
    sendRequest: post,
    parseResponse: parseGeometrySearchResponse
};
