import { GeometrySearchRequest, GeometrySearchResponse } from "./types";
import { geometrySearchTemplate, GeometrySearchTemplate } from "./GeometrySearchTemplate";
import { callService } from "../shared/ServiceTemplate";

/**
 *
 * @param params Mandatory and optional parameters.
 * @param customTemplate Advanced parameter to plug in how the service treats requests and responses.
 * @see https://developer.tomtom.com/search-api/documentation/geocoding-service/geocode
 * @returns Promise<GeometrySearchResponse>
 */
export const geometrySearch = async (
    params: GeometrySearchRequest,
    customTemplate?: Partial<GeometrySearchTemplate>
): Promise<GeometrySearchResponse> => {
    return callService(params, { ...geometrySearchTemplate, ...customTemplate }, "GeometrySearch");
};

export default geometrySearch;
