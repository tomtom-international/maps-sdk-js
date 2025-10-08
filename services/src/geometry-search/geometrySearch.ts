import { callService } from '../shared/serviceTemplate';
import type { GeometrySearchTemplate } from './geometrySearchTemplate';
import { geometrySearchTemplate } from './geometrySearchTemplate';
import type { GeometrySearchParams, GeometrySearchResponse } from './types';

/**
 *
 * @param params Mandatory and optional parameters.
 * @param customTemplate Advanced parameter to plug in how the service treats requests and responses.
 * @see https://docs.tomtom.com/search-api/documentation/search-service/geometry-search
 */
export const geometrySearch = async (
    params: GeometrySearchParams,
    customTemplate?: Partial<GeometrySearchTemplate>,
): Promise<GeometrySearchResponse> =>
    callService(params, { ...geometrySearchTemplate, ...customTemplate }, 'GeometrySearch');

export default geometrySearch;
