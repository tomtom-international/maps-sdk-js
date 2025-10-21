import { callService } from '../shared/serviceTemplate';
import type { PlaceByIdTemplate } from './placeByIdTemplate';
import { placeByIdTemplate } from './placeByIdTemplate';
import type { PlaceByIdParams, PlaceByIdResponse } from './types';

/**
 * Retrieve detailed information about a place using its unique identifier.
 *
 * The Place by ID service fetches comprehensive data for a specific place when you
 * have its ID from a previous search or from a place's dataSources. This is useful
 * for getting additional details or refreshing information about a known location.
 *
 * @remarks
 * Use cases:
 * - **Fetch POI details**: Get extended information like reviews, photos, amenities
 * - **Refresh place data**: Update information for a cached place
 * - **Deep linking**: Allow users to share/bookmark specific places
 * - **Related POI navigation**: Explore parent/child relationships
 *
 * The ID can be obtained from:
 * - Previous search results (place.id)
 * - POI details data source (place.properties.dataSources.poiDetails.id)
 * - Related POIs (place.properties.relatedPois[].id)
 * - Deep links or bookmarks
 *
 * @param params - Place by ID parameters with the place identifier
 * @param customTemplate - Advanced customization for request/response handling
 *
 * @returns Promise resolving to detailed place information
 *
 * @example
 * ```typescript
 * // Get place by ID from search result
 * const searchResult = await search({ query: 'Eiffel Tower' });
 * const placeId = searchResult.features[0].id;
 *
 * const placeDetails = await placeById({
 *   key: 'your-api-key',
 *   entityId: placeId
 * });
 *
 * // Get extended POI details
 * const place = searchResult.features[0];
 * const poiDetailsId = place.properties.dataSources?.poiDetails?.id;
 *
 * if (poiDetailsId) {
 *   const detailedPOI = await placeById({
 *     key: 'your-api-key',
 *     entityId: poiDetailsId
 *   });
 *   // May include additional photos, reviews, extended hours, etc.
 * }
 *
 * // Navigate to related POI
 * const relatedPOI = place.properties.relatedPois?.[0];
 * if (relatedPOI) {
 *   const parentPlace = await placeById({
 *     key: 'your-api-key',
 *     entityId: relatedPOI.id
 *   });
 *   console.log('Parent location:', parentPlace.properties.address);
 * }
 * ```
 *
 * @see [Place by ID API Documentation](https://docs.tomtom.com/search-api/documentation/place-by-id-service/place-by-id)
 * @see [Places Quickstart Guide](https://docs.tomtom.com/maps-sdk-js/guides/services/places/quickstart)
 *
 * @group Place
 */
export const placeById = async (
    params: PlaceByIdParams,
    customTemplate?: Partial<PlaceByIdTemplate>,
): Promise<PlaceByIdResponse> => callService(params, { ...placeByIdTemplate, ...customTemplate }, 'PlaceById');

export default placeById;
