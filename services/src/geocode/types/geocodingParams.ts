import type { HasLngLat } from '@tomtom-org/maps-sdk/core';
import type { CommonGeocodeAndFuzzySearchParams, CommonPlacesParams, SearchIndexType } from '../../shared';
import type { GeocodingResponseAPI } from './apiTypes';

type GeocodingIndexTypesAbbreviation = Exclude<SearchIndexType, 'POI'>;

/**
 * Parameters for geocoding addresses into geographic coordinates.
 *
 * Geocoding converts human-readable addresses into latitude/longitude coordinates,
 * enabling you to place markers on maps or perform spatial operations.
 *
 * @remarks
 * This service is optimized for address lookups and does not return POIs.
 * For POI search, use the search service instead.
 *
 * **Features:**
 * - Tolerant of typos and incomplete addresses
 * - Handles various address formats
 * - Supports street addresses, intersections, cross streets
 * - Works with geographies (cities, counties, states, countries)
 * - Returns structured address components
 *
 * @example
 * ```typescript
 * // Geocode a complete address
 * const params: GeocodingParams = {
 *   key: 'your-api-key',
 *   query: '1600 Pennsylvania Avenue NW, Washington, DC'
 * };
 *
 * // Geocode with bias toward a location
 * const biasedParams: GeocodingParams = {
 *   key: 'your-api-key',
 *   query: 'Main Street',
 *   at: [4.9041, 52.3676],  // Bias toward Amsterdam
 *   limit: 5
 * };
 * ```
 *
 * @group Geocoding
 */
export type GeocodingParams = Omit<
    CommonPlacesParams<URL, GeocodingResponseAPI> & CommonGeocodeAndFuzzySearchParams,
    'extendedPostalCodesFor'
> & {
    /**
     * Address or location query to geocode.
     *
     * The text to convert into geographic coordinates — typically a street address,
     * intersection, city name, or landmark. The service is tolerant of typos and
     * incomplete inputs.
     *
     * @remarks
     * **Query Examples:**
     * - Full street address: "1600 Pennsylvania Avenue NW, Washington, DC"
     * - City name: "Amsterdam"
     * - Intersection: "Broadway & 42nd St, New York"
     * - Landmark: "Eiffel Tower, Paris"
     * - Partial address: "Dam Square" (city context resolved via `position` or `countries`)
     *
     * @example
     * ```typescript
     * query: '1600 Pennsylvania Avenue NW, Washington, DC'
     * query: 'Museumplein, Amsterdam'
     * query: 'Buckingham Palace, London'
     * ```
     */
    query: string;

    /**
     * Geographic position to bias geocoding results toward.
     *
     * When provided, results closer to this position are ranked higher.
     * Useful for resolving ambiguous queries (e.g. "Main Street") to
     * the right city or region.
     *
     * Accepts any {@link HasLngLat}-compatible value:
     * - `[longitude, latitude]` coordinate pair
     * - GeoJSON `Point` geometry
     * - GeoJSON `Feature<Point>` — pass a {@link Place} directly
     *
     * @example
     * ```typescript
     * // Coordinate pair
     * position: [4.9041, 52.3676]
     *
     * // Place result from a previous search (e.g. user's selected location)
     * position: selectedPlace
     *
     * // GeoJSON Point
     * position: { type: 'Point', coordinates: [4.9041, 52.3676] }
     * ```
     */
    position?: HasLngLat;

    /**
     * Indexes for which extended postal codes should be included in the results.
     *
     * @remarks
     * Extended postal codes provide additional postal code detail for addresses.
     * By default, they are included for all indexes except geographic areas (Geo).
     *
     * **Available index types:**
     * - `PAD`: Point Address
     * - `Addr`: Address Range
     * - `Str`: Street
     * - `Xstr`: Cross Street
     * - `Geo`: Geography
     *
     * Geographic areas (Geo) can have very long postal code lists, so they must
     * be explicitly requested when needed.
     *
     * @default All indexes except Geo
     *
     * @example
     * ```typescript
     * // Include extended postal codes for addresses only
     * extendedPostalCodesFor: ['PAD', 'Addr']
     *
     * // Include for all indexes including geographies
     * extendedPostalCodesFor: ['PAD', 'Addr', 'Str', 'Xstr', 'Geo']
     * ```
     */
    extendedPostalCodesFor?: GeocodingIndexTypesAbbreviation[];
};
