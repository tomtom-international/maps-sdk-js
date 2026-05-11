import { callService } from '../shared/serviceTemplate';
import type { ExplorationSearchTemplate } from './explorationSearchTemplate';
import { explorationSearchTemplate } from './explorationSearchTemplate';
import type { ExplorationSearchParams, ExplorationSearchResponse } from './types';

/**
 * Search for places via the exploration places API.
 *
 * The exploration search service exposes the same input and output surface as
 * the existing {@link search} service, but targets the exploration places API
 * (POST `/places` with a JSON body) instead of the TomTom Search API.
 *
 * @remarks
 * Key features:
 * - **Fuzzy name match** via {@link ExplorationSearchParams.query}
 * - **Near filter** via `position` + `radiusMeters` (mapped to `near.coordinates` + `near.radius_km`)
 * - **Bounding box** via `boundingBox` (mapped to `bboxes`)
 * - **Geometries** via {@link ExplorationSearchParams.geometries} (Polygon,
 *   MultiPolygon, Circle, or FeatureCollection — same shape as {@link geometrySearch})
 * - **Brand / category / country / municipalities** filters
 * - **Pagination** via `offset` / `limit` (mapped to `from` / `size`)
 *
 * @param params Exploration search parameters
 * @param customTemplate Advanced customization for request/response handling
 *
 * @returns Promise resolving to a collection of matching places, with the same
 * {@link SearchPlaceProps} shape used by the existing search service.
 *
 * @example
 * ```typescript
 * // Nearest restaurants to Dam Square
 * const results = await explorationSearch({
 *   position: [4.9003, 52.3791],
 *   radiusMeters: 5000,
 *   poiCategories: ['RESTAURANT'],
 *   limit: 10,
 * });
 *
 * // Inside a GeoJSON polygon
 * const inArea = await explorationSearch({
 *   geometries: [{
 *     type: 'Polygon',
 *     coordinates: [[
 *       [4.878, 52.364], [4.922, 52.364],
 *       [4.922, 52.394], [4.878, 52.394],
 *       [4.878, 52.364],
 *     ]],
 *   }],
 *   poiCategories: ['RESTAURANT'],
 * });
 * ```
 *
 * @ignore
 * @experimental
 */
export const explorationSearch = async (
    params: ExplorationSearchParams,
    customTemplate?: Partial<ExplorationSearchTemplate>,
): Promise<ExplorationSearchResponse> =>
    callService(params, { ...explorationSearchTemplate, ...customTemplate }, 'ExplorationSearch');
