import { parseGeometrySearchResponse } from "./responseParser";
import { buildGeometrySearchRequest } from "./requestBuilder";
import { post } from "../shared/fetch";
import type { ServiceTemplate } from "../shared";
import type {
    GeometrySearchParams,
    GeometrySearchResponse,
    GeometrySearchResponseAPI,
    GeometrySearchRequestAPI
} from "./types";
import { geometrySearchRequestSchema } from "./geometrySearchRequestSchema";

/**
 * Geometry search service template type.
 */
export type GeometrySearchTemplate = ServiceTemplate<
    GeometrySearchParams,
    GeometrySearchRequestAPI,
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
