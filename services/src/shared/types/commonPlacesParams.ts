import type { GeographyType, HasLngLat, MapcodeType, View } from '@tomtom-org/maps-sdk-js/core';
import type { CommonServiceParams } from '../serviceTypes';

/**
 * Index representing the type of place data to search.
 *
 * Specifies which category of place data to include in search results.
 * Different index types return different kinds of location information.
 *
 * @remarks
 * **Index Types:**
 * - `Geo`: Geographic entities (countries, states, cities, neighborhoods)
 * - `PAD`: Point Address - Specific street addresses with building numbers
 * - `Addr`: Address Range - Street segments with address ranges
 * - `Str`: Street names without specific addresses
 * - `XStr`: Cross Streets - Intersections of two streets
 * - `POI`: Points of Interest (businesses, landmarks, facilities)
 *
 * **Use with `extendedPostalCodesFor`:**
 * By default, extended postal codes are included for all indexes except `Geo`.
 * Use this type to explicitly request extended postal codes for specific indexes.
 *
 * @example
 * ```typescript
 * // Request extended postal codes for addresses and POIs
 * const indexes: SearchIndexType[] = ['PAD', 'Addr', 'POI'];
 * ```
 *
 * @group Search
 */
export type SearchIndexType = 'Geo' | 'PAD' | 'Addr' | 'Str' | 'XStr' | 'POI';

/**
 * Common parameters shared across places-related services.
 *
 * These parameters are used by search, geocoding, and reverse geocoding services
 * to customize query behavior, filter results, and control response formatting.
 *
 * @typeParam ApiRequest - The API request type (typically URL or FetchInput)
 * @typeParam ApiResponse - The API response type
 *
 * @remarks
 * **Applied to Services:**
 * - {@link search} and {@link fuzzySearch}
 * - {@link geocode}
 * - {@link reverseGeocode}
 * - {@link autocompleteSearch}
 * - {@link geometrySearch}
 *
 * **Key Features:**
 * - Result limits and pagination
 * - Geographic biasing for location-aware results
 * - Result type filtering (addresses, POIs, geographies)
 * - Additional data inclusion (mapcodes, extended postal codes)
 * - Geopolitical view context for disputed territories
 *
 * @example
 * ```typescript
 * // Basic search with position bias
 * const searchParams: CommonPlacesParams<URL, Response> = {
 *   query: 'pizza restaurant',
 *   position: [4.9041, 52.3676],  // Near Amsterdam
 *   limit: 20
 * };
 *
 * // Search with geography type filter
 * const citySearch: CommonPlacesParams<URL, Response> = {
 *   query: 'Paris',
 *   geographyTypes: ['Municipality'],  // Only cities
 *   limit: 10
 * };
 *
 * // Search with mapcodes and specific geopolitical view
 * const detailedSearch: CommonPlacesParams<URL, Response> = {
 *   query: 'disputed location',
 *   view: 'IN',  // India's perspective
 *   mapcodes: ['Local', 'International'],
 *   extendedPostalCodesFor: ['PAD', 'POI'],
 *   limit: 5
 * };
 *
 * // Address search with extended postal codes
 * const addressSearch: CommonPlacesParams<URL, Response> = {
 *   query: '123 Main Street',
 *   geographyTypes: ['Country', 'Municipality'],
 *   extendedPostalCodesFor: ['Geo', 'PAD', 'Addr'],
 *   limit: 15
 * };
 * ```
 *
 * @group Search
 */
export type CommonPlacesParams<ApiRequest, ApiResponse> = CommonServiceParams<ApiRequest, ApiResponse> & {
    /**
     * Search query string.
     *
     * The text to search for - can be an address, place name, POI, or general location query.
     * Must be properly URL encoded when sent to the API.
     *
     * @remarks
     * **Query Examples:**
     * - Street addresses: "123 Main Street, New York"
     * - Place names: "Eiffel Tower", "Central Park"
     * - POI names: "Starbucks", "McDonald's"
     * - General queries: "pizza near me", "gas station"
     * - Partial inputs: "Amst" (for autocomplete)
     *
     * The query is processed with fuzzy matching to handle typos and variations.
     *
     * @example
     * ```typescript
     * query: "1600 Pennsylvania Avenue, Washington DC"
     * query: "Amsterdam Central Station"
     * query: "coffee shop"
     * ```
     */
    query: string;

    /**
     * Geographic position to bias search results.
     *
     * When provided, results closer to this position are ranked higher.
     * Does not filter results, only influences ranking.
     *
     * @remarks
     * **Coordinates:**
     * - Longitude: -180 to +180 (East-West)
     * - Latitude: -90 to +90 (North-South)
     * - Format: [longitude, latitude]
     *
     * **Without Radius:**
     * Supplying position without a radius parameter biases results toward this area
     * but doesn't create a hard boundary.
     *
     * **Use Cases:**
     * - "Find pizza near me" - bias toward user's location
     * - "Main Street" - prioritize Main Streets in the target area
     * - Local search within a city or region
     *
     * @example
     * ```typescript
     * position: [4.9041, 52.3676]  // Amsterdam coordinates
     * position: [-74.0060, 40.7128]  // New York coordinates
     * ```
     */
    position?: HasLngLat;

    /**
     * Maximum number of results to return.
     *
     * Controls pagination by limiting the number of results in a single response.
     * Use with `offset` (in specific service params) for pagination.
     *
     * @remarks
     * **Range:** 1 to 100
     *
     * **Considerations:**
     * - Higher limits increase response size and processing time
     * - Lower limits improve performance
     * - Use pagination for large result sets
     *
     * @default 10
     *
     * @example
     * ```typescript
     * limit: 20   // Get 20 results
     * limit: 5    // Get only top 5 results
     * limit: 100  // Maximum allowed
     * ```
     */
    limit?: number;

    /**
     * Indexes for which to include extended postal codes in results.
     *
     * Extended postal codes provide more detailed postal code information
     * including sub-divisions and hierarchical structures.
     *
     * @remarks
     * **Default Behavior:**
     * Extended postal codes are included for all indexes except `Geo` by default.
     * Geographic entities can have very long postal code lists, so they must
     * be explicitly requested when needed.
     *
     * **Extended vs Regular Postal Codes:**
     * - Regular: "10001" (basic ZIP code)
     * - Extended: "10001-1234" (ZIP+4 format)
     *
     * **Performance Note:**
     * Including extended postal codes for geographies can significantly
     * increase response size.
     *
     * @example
     * ```typescript
     * // Include for addresses and POIs only
     * extendedPostalCodesFor: ['PAD', 'Addr', 'POI']
     *
     * // Include for all types including geographies
     * extendedPostalCodesFor: ['Geo', 'PAD', 'Addr', 'Str', 'XStr', 'POI']
     * ```
     */
    extendedPostalCodesFor?: SearchIndexType[];

    /**
     * Request mapcode representations for locations.
     *
     * Mapcodes are short, human-friendly location codes that can represent
     * any location on Earth to within a few meters. They're easier to
     * remember and communicate than coordinates.
     *
     * @remarks
     * **Mapcode Types:**
     * - `Local`: Short codes valid within a specific territory (e.g., "49.4V" in Netherlands)
     * - `International`: Codes that work globally (e.g., "NLD 49.4V")
     * - `Alternative`: Alternative representations for the same location
     *
     * **Use Cases:**
     * - Emergency services (shorter than full addresses)
     * - Areas without formal addressing systems
     * - Easy verbal communication of locations
     * - Navigation to precise spots
     *
     * @see [Mapcode Project](https://www.mapcode.com)
     *
     * @example
     * ```typescript
     * // Get all mapcode types
     * mapcodes: ['Local', 'International', 'Alternative']
     *
     * // Get only local mapcodes
     * mapcodes: ['Local']
     * ```
     */
    mapcodes?: MapcodeType[];

    /**
     * Geopolitical view for disputed territories.
     *
     * Determines how borders and place names are displayed for disputed
     * territories, according to different countries' perspectives.
     *
     * @remarks
     * **Available Views:**
     * - `Unified`: International/neutral view (default)
     * - `AR`: Argentina's perspective
     * - `IN`: India's perspective
     * - `PK`: Pakistan's perspective
     * - `IL`: Israel's perspective
     * - `MA`: Morocco's perspective
     * - `RU`: Russia's perspective
     * - `TR`: Turkey's perspective
     * - `CN`: China's perspective
     *
     * **Affected Elements:**
     * - Border lines on maps
     * - Territory names
     * - Administrative classifications
     * - Place name spellings
     *
     * **Legal Compliance:**
     * Use appropriate views based on your target audience and
     * legal requirements in different regions.
     *
     * @default 'Unified'
     *
     * @example
     * ```typescript
     * view: 'Unified'  // Neutral international view
     * view: 'IN'       // India's perspective
     * view: 'CN'       // China's perspective
     * ```
     */
    view?: View;

    /**
     * Filter results to specific geography types.
     *
     * Restricts results to only geographic entities of the specified types,
     * filtering out other result types like POIs or addresses.
     *
     * @remarks
     * **Geography Hierarchy (largest to smallest):**
     * - `Country`: Sovereign nations
     * - `CountrySubdivision`: States, provinces, regions
     * - `CountrySecondarySubdivision`: Counties, districts
     * - `CountryTertiarySubdivision`: Sub-districts
     * - `Municipality`: Cities, towns
     * - `MunicipalitySubdivision`: City districts
     * - `Neighbourhood`: Neighborhoods, quarters
     * - `PostalCodeArea`: Areas defined by postal codes
     *
     * **Filtering Behavior:**
     * When specified, only Geography results with matching entity types
     * are returned. POIs, addresses, and other result types are excluded.
     *
     * **Use Cases:**
     * - City/country search for travel apps
     * - Administrative boundary lookups
     * - Filtering out POI noise in geographic searches
     * - Hierarchical location pickers
     *
     * @example
     * ```typescript
     * // Search only for cities
     * geographyTypes: ['Municipality']
     *
     * // Search for countries and cities
     * geographyTypes: ['Country', 'Municipality']
     *
     * // Search for all administrative levels
     * geographyTypes: [
     *   'Country',
     *   'CountrySubdivision',
     *   'CountrySecondarySubdivision',
     *   'Municipality'
     * ]
     *
     * // Search for postal code areas only
     * geographyTypes: ['PostalCodeArea']
     * ```
     */
    geographyTypes?: GeographyType[];
};
