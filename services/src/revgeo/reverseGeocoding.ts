import type { Place, RevGeoAddressProps } from '@tomtom-org/maps-sdk/core';
import { callService } from '../shared/serviceTemplate';
import type { ReverseGeocodingTemplate } from './reverseGeocodingTemplate';
import { reverseGeocodingTemplate } from './reverseGeocodingTemplate';
import type { ReverseGeocodingParams } from './types/reverseGeocodingParams';

/**
 * Response from the reverse geocoding service.
 *
 * Contains a place with address information for the given coordinates.
 *
 * @group Reverse Geocoding
 */
export type ReverseGeocodingResponse = Place<RevGeoAddressProps>;

/**
 * Convert geographic coordinates into human-readable addresses (reverse geocoding).
 *
 * Reverse geocoding translates latitude/longitude coordinates into street addresses,
 * which is essential for location-based applications that need to display addresses
 * from GPS coordinates or map clicks.
 *
 * @remarks
 * Common use cases:
 * - **Tracking applications**: Convert GPS coordinates from devices into addresses
 * - **Map interactions**: Display address when user clicks on map
 * - **Location sharing**: Show readable location instead of coordinates
 * - **Delivery apps**: Confirm pickup/dropoff addresses from driver location
 * - **Asset tracking**: Display current location of vehicles or equipment
 *
 * Features:
 * - Returns complete address hierarchy (street, city, state, country)
 * - Returns the result type (address, street, or geography)
 * - Narrows results to administrative areas with `geographyType`
 * - Direction-aware street matching with `heading`
 *
 * @param params - Reverse geocoding parameters including coordinates
 * @param customTemplate - Advanced customization for request/response handling
 *
 * @returns Promise resolving to the address for the given coordinates
 *
 * @example
 * ```typescript
 * // Get address for coordinates
 * const address = await reverseGeocode({
 *   key: 'your-api-key',
 *   position: [4.9041, 52.3676]  // Amsterdam coordinates
 * });
 * // Returns: Dam, 1012 Amsterdam, Netherlands
 *
 * // Get the address matched along a given travel direction
 * const specificAddress = await reverseGeocode({
 *   key: 'your-api-key',
 *   position: [-77.0369, 38.8977],  // Washington DC
 *   heading: 90                     // Traveling east
 * });
 *
 * // Get the containing municipality instead of the street
 * const municipality = await reverseGeocode({
 *   key: 'your-api-key',
 *   position: [-74.0060, 40.7128],  // New York
 *   geographyType: ['Municipality']
 * });
 * ```
 *
 * @see [Reverse Geocode API Documentation](https://docs.tomtom.com/search-api/documentation/reverse-geocoding-service/reverse-geocode)
 * @see [Places Quickstart Guide](https://docs.tomtom.com/maps-sdk-js/guides/services/places/quickstart)
 * @see [Reverse Geocoding Guide](https://docs.tomtom.com/maps-sdk-js/guides/services/places/reverse-geocoding)
 *
 * @group Reverse Geocoding
 */
export const reverseGeocode = async (
    params: ReverseGeocodingParams,
    customTemplate?: Partial<ReverseGeocodingTemplate>,
): Promise<ReverseGeocodingResponse> =>
    callService(params, { ...reverseGeocodingTemplate, ...customTemplate }, 'ReverseGeocode');
