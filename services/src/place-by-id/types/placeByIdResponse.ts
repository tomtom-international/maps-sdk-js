import type { Place, SearchPlaceProps } from '@cet/maps-sdk-js/core';

/**
 * Response from the place by ID service.
 *
 * Returns detailed information for a specific place identified by its unique ID,
 * or undefined if the place is not found.
 *
 * @remarks
 * This service is typically used to fetch complete details for a place when you
 * already have its ID from a previous search or geocoding operation.
 *
 * @group Place By ID
 */
export type PlaceByIdResponse = Place<SearchPlaceProps> | undefined;
