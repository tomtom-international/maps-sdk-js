import { GeometrySearchParams, GeometrySearchResponse } from "./types";
import { geometrySearchTemplate, GeometrySearchTemplate } from "./geometrySearchTemplate";
import { callService } from "../shared/serviceTemplate";

/**
 *
 * @param params Mandatory and optional parameters.
 * @param customTemplate Advanced parameter to plug in how the service treats requests and responses.
 * @see https://developer.tomtom.com/search-api/documentation/search-service/geometry-search
 */
export const geometrySearch = async (
    params: GeometrySearchParams,
    customTemplate?: Partial<GeometrySearchTemplate>
): Promise<GeometrySearchResponse> =>
    callService(params, { ...geometrySearchTemplate, ...customTemplate }, "GeometrySearch");

export default geometrySearch;
