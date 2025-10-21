import { callService } from '../shared/serviceTemplate';
import type { GeocodingTemplate } from './geocodingTemplate';
import { geocodingTemplate } from './geocodingTemplate';
import type { GeocodingParams } from './types/geocodingParams';
import type { GeocodingResponse } from './types/geocodingResponse';

/**
 * Convert addresses into geographic coordinates (geocoding).
 *
 * The Geocode service translates addresses and place names into geographic coordinates,
 * enabling you to position markers on maps, calculate routes, or perform spatial analysis.
 *
 * @remarks
 * This service is optimized for address lookup and does not return POIs (Points of Interest).
 * For POI search, use the {@link search} function instead.
 *
 * Features:
 * - Highly tolerant of typos and incomplete addresses
 * - Handles various address formats and components
 * - Supports street addresses, intersections, and cross streets
 * - Works with higher-level geographies (cities, counties, states, countries)
 * - Returns structured address components
 *
 * @param params - Geocoding parameters including the address query
 * @param customTemplate - Advanced customization for request/response handling
 *
 * @returns Promise resolving to geocoded location results
 *
 * @example
 * ```typescript
 * // Geocode a complete address
 * const result = await geocode({
 *   key: 'your-api-key',
 *   query: '1600 Pennsylvania Avenue NW, Washington, DC'
 * });
 *
 * // Geocode with partial address
 * const partialResult = await geocode({
 *   key: 'your-api-key',
 *   query: 'Amsterdam, Netherlands'
 * });
 *
 * // Geocode with bias towards specific location
 * const biasedResult = await geocode({
 *   key: 'your-api-key',
 *   query: 'Main Street',
 *   at: [4.9041, 52.3676],  // Bias toward Amsterdam
 *   limit: 5
 * });
 *
 * // Geocode an intersection
 * const intersection = await geocode({
 *   key: 'your-api-key',
 *   query: '5th Avenue & 42nd Street, New York'
 * });
 * ```
 *
 * @see [Geocode API Documentation](https://docs.tomtom.com/search-api/documentation/geocoding-service/geocode)
 * @see [Places Quickstart Guide](https://docs.tomtom.com/maps-sdk-js/guides/services/places/quickstart)
 * @see [Geocoding Guide](https://docs.tomtom.com/maps-sdk-js/guides/services/places/geocoding)
 *
 * @group Geocode
 */
export const geocode = async (
    params: GeocodingParams,
    customTemplate?: Partial<GeocodingTemplate>,
): Promise<GeocodingResponse> => callService(params, { ...geocodingTemplate, ...customTemplate }, 'Geocode');

export default geocode;
