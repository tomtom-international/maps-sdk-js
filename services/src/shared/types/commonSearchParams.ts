import type { ConnectorType, Fuel, OpeningHoursMode, POICategory } from '@tomtom-org/maps-sdk-js/core';
import type { CommonPlacesParams, SearchIndexType } from './commonPlacesParams';

/**
 * Related POI inclusion mode for search requests.
 *
 * Controls which related Points of Interest are included in search results
 * based on hierarchical relationships (parent/child).
 *
 * @remarks
 * **Relationship Modes:**
 * - `off`: No related POIs included (default)
 * - `child`: Include child POIs (e.g., terminals within an airport)
 * - `parent`: Include parent POIs (e.g., airport containing a terminal)
 * - `all`: Include both parent and child relationships
 *
 * **Example Relationships:**
 * - Airport (parent) ↔ Terminal (child)
 * - Shopping Mall (parent) ↔ Individual Store (child)
 * - University (parent) ↔ Department Building (child)
 *
 * @example
 * ```typescript
 * const mode: RelatedPoisRequest = 'child';  // Include child POIs
 * const mode2: RelatedPoisRequest = 'all';   // Include all related
 * ```
 *
 * @group Search
 */
export type RelatedPoisRequest = 'child' | 'parent' | 'all' | 'off';

/**
 * Timezone data format for POI responses.
 *
 * Specifies which timezone identifier format to include in search results.
 *
 * @remarks
 * **Format:**
 * - `iana`: IANA Time Zone Database identifier (e.g., "Europe/Amsterdam", "America/New_York")
 *
 * **Use Cases:**
 * - Display local time at POI location
 * - Schedule appointments considering timezone
 * - Calculate opening hours in local time
 * - International coordination
 *
 * @see [IANA Time Zone Database](https://www.iana.org/time-zones)
 *
 * @example
 * ```typescript
 * const format: TimeZoneRequest = 'iana';
 * // Response includes: { ianaId: "Europe/Amsterdam" }
 * ```
 *
 * @group Search
 */
export type TimeZoneRequest = 'iana';

/**
 * Common parameters for search services with POI filtering capabilities.
 *
 * Extends basic places parameters with advanced search features including
 * category filtering, brand filtering, and EV charging station specifics.
 *
 * @typeParam ApiRequest - The API request type
 * @typeParam ApiResponse - The API response type
 *
 * @remarks
 * Used by:
 * - {@link search}
 * - {@link fuzzySearch}
 * - {@link geometrySearch}
 *
 * Provides extensive filtering options for:
 * - POI categories and brands
 * - EV charging station specifications
 * - Fuel type availability
 * - Opening hours and timezone data
 * - Related POI relationships
 *
 * @see [Search Service Documentation](https://docs.tomtom.com/search-api/documentation/search-service/search-service)
 *
 * @group Search
 */
export type CommonSearchParams<ApiRequest, ApiResponse> = CommonPlacesParams<ApiRequest, ApiResponse> & {
    /**
     * Specify which search indexes to query.
     *
     * Fine-tunes search by selecting specific data categories to include.
     * By default, all indexes are searched.
     *
     * @remarks
     * **Available Indexes:**
     * - `Geo`: Geographic entities (countries, cities, etc.)
     * - `PAD`: Point addresses with building numbers
     * - `Addr`: Address ranges on streets
     * - `Str`: Street names
     * - `XStr`: Cross streets (intersections)
     * - `POI`: Points of interest
     *
     * **Use Cases:**
     * - POI-only search: `['POI']`
     * - Address-only search: `['PAD', 'Addr']`
     * - Exclude geographies: `['PAD', 'Addr', 'Str', 'POI']`
     *
     * @example
     * ```typescript
     * // Search only POIs
     * indexes: ['POI']
     *
     * // Search addresses and streets only
     * indexes: ['PAD', 'Addr', 'Str']
     * ```
     */
    indexes?: SearchIndexType[];

    /**
     * Filter results to specific POI categories.
     *
     * Restricts results to Points of Interest belonging to the specified
     * categories. Use category IDs from the POI Categories API.
     *
     * @remarks
     * **Category Examples:**
     * - 7315: Restaurant
     * - 7311: Petrol/Gas Station
     * - 7313: Hotel/Motel
     * - 7832: ATM
     * - 9361: Parking
     *
     * **Multiple Categories:**
     * Results include POIs matching ANY of the specified categories (OR logic).
     *
     * **Discovery:**
     * Use the POI Categories endpoint to browse all available categories.
     *
     * @example
     * ```typescript
     * // Restaurants only
     * poiCategories: [7315]
     *
     * // Restaurants and cafes
     * poiCategories: [7315, 9376]
     *
     * // Gas stations and EV charging
     * poiCategories: [7311, 7309]
     * ```
     */
    poiCategories?: (number | POICategory)[];

    /**
     * Filter results to specific POI brands.
     *
     * Restricts results to Points of Interest belonging to the specified
     * brand names. Useful for finding specific chain locations.
     *
     * @remarks
     * **Brand Names:**
     * - Case-sensitive
     * - Exact match required
     * - Brands with commas must be quoted: `"A,B,C"`
     *
     * **Multiple Brands:**
     * Results include POIs matching ANY of the specified brands (OR logic).
     *
     * **Use Cases:**
     * - Find specific chain stores: "Starbucks", "McDonald's"
     * - Compare competing brands
     * - Brand-specific navigation
     *
     * @example
     * ```typescript
     * // Single brand
     * poiBrands: ['Starbucks']
     *
     * // Multiple brands
     * poiBrands: ['Shell', 'BP', 'Chevron']
     *
     * // Brand with comma in name
     * poiBrands: ['"A,B,C"']
     * ```
     */
    poiBrands?: string[];

    /**
     * Filter EV charging stations by connector types.
     *
     * Restricts results to EV charging stations that support at least one
     * of the specified connector types. Essential for EV drivers to find
     * compatible charging infrastructure.
     *
     * @remarks
     * **Common Connector Types:**
     * - `IEC62196Type2CableAttached`: Type 2 / Mennekes (Europe)
     * - `IEC62196Type2CCS`: CCS Combo 2 (Europe)
     * - `IEC62196Type1CCS`: CCS Combo 1 (North America)
     * - `Chademo`: CHAdeMO (Japan)
     * - `Tesla`: Tesla proprietary
     *
     * **Multiple Connectors:**
     * Results include stations with ANY of the specified connectors (OR logic).
     *
     * **Use Cases:**
     * - Find compatible chargers for specific EV model
     * - Route planning for long-distance EV travel
     * - Filter by fast charging capability
     *
     * @example
     * ```typescript
     * // CCS Combo 2 (common in Europe)
     * connectors: ['IEC62196Type2CCS']
     *
     * // Multiple connector types
     * connectors: ['IEC62196Type2CCS', 'Chademo']
     *
     * // Tesla or CCS
     * connectors: ['Tesla', 'IEC62196Type2CCS']
     * ```
     */
    connectors?: ConnectorType[];

    /**
     * Filter fuel stations by available fuel types.
     *
     * Restricts results to fuel stations that offer the specified fuel types.
     * Can be used with empty query to find any station with specific fuel.
     *
     * @remarks
     * **Common Fuel Types:**
     * - Petrol/Gasoline
     * - Diesel
     * - LPG (Liquefied Petroleum Gas)
     * - CNG (Compressed Natural Gas)
     * - E85 (Ethanol blend)
     * - AdBlue (Diesel exhaust fluid)
     *
     * **Multiple Fuel Types:**
     * Results include stations offering ANY of the specified fuels (OR logic).
     *
     * **Empty Query:**
     * When `fuelTypes` is specified, the query parameter can be empty,
     * and all POIs with matching fuel types will be returned.
     *
     * @example
     * ```typescript
     * // Diesel stations only
     * fuelTypes: ['Diesel']
     *
     * // Alternative fuels
     * fuelTypes: ['CNG', 'LPG', 'E85']
     *
     * // Standard fuels
     * fuelTypes: ['Petrol', 'Diesel']
     * ```
     */
    fuelTypes?: Fuel[];

    /**
     * Request opening hours information for POIs.
     *
     * Specifies the format and detail level of opening hours data
     * included in the response.
     *
     * @remarks
     * **Opening Hours Modes:**
     * Different modes provide varying levels of detail about when
     * a POI is open for business.
     *
     * **Use Cases:**
     * - Display "Open Now" status
     * - Show full weekly schedule
     * - Plan visits during open hours
     * - Filter to currently open locations
     *
     * @example
     * ```typescript
     * // Request opening hours
     * openingHours: 'nextSevenDays'
     * ```
     */
    openingHours?: OpeningHoursMode;

    /**
     * Request timezone information for POI locations.
     *
     * Includes timezone data in the response, useful for scheduling
     * and time-aware applications.
     *
     * @remarks
     * **Timezone Format:**
     * - `iana`: Returns IANA timezone identifier (e.g., "Europe/Amsterdam")
     *
     * **Use Cases:**
     * - Display local time for POI
     * - Schedule appointments across timezones
     * - Calculate opening hours in local time
     * - International business coordination
     *
     * @example
     * ```typescript
     * // Request IANA timezone ID
     * timeZone: 'iana'
     * ```
     */
    timeZone?: TimeZoneRequest;

    /**
     * Include related POIs in the response.
     *
     * Some POIs have hierarchical relationships (e.g., terminal inside airport).
     * This parameter controls which related POIs are included.
     *
     * @remarks
     * **Relationship Types:**
     * - `off`: No related POIs (default)
     * - `child`: Include child POIs (e.g., terminals of an airport)
     * - `parent`: Include parent POIs (e.g., airport of a terminal)
     * - `all`: Include both parent and child relationships
     *
     * **Use Cases:**
     * - Show all terminals when user searches for airport
     * - Navigate from specific location to broader facility
     * - Display hierarchical location structure
     * - Provide alternative entry points
     *
     * @default 'off'
     *
     * @example
     * ```typescript
     * // Include child POIs
     * relatedPois: 'child'  // Airport → show terminals
     *
     * // Include parent POIs
     * relatedPois: 'parent'  // Terminal → show airport
     *
     * // Include all related POIs
     * relatedPois: 'all'
     * ```
     */
    relatedPois?: RelatedPoisRequest;

    /**
     * Minimum charging power for EV stations (in kilowatts).
     *
     * Filters EV charging stations to those supporting at least one
     * connector with the specified minimum power output. Useful for
     * finding fast charging capabilities.
     *
     * @remarks
     * **Power Levels:**
     * - 3-7 kW: Level 2 AC (slow charging)
     * - 7-22 kW: Level 2 AC (moderate charging)
     * - 50+ kW: DC fast charging
     * - 150+ kW: Ultra-fast charging
     * - 350 kW: Maximum current technology
     *
     * **Closed Interval:**
     * Includes stations with exactly this power value.
     *
     * @example
     * ```typescript
     * // Fast charging (50kW+)
     * minPowerKW: 50
     *
     * // Ultra-fast charging (150kW+)
     * minPowerKW: 150
     *
     * // Combined with max power
     * minPowerKW: 50,
     * maxPowerKW: 150  // 50-150 kW range
     * ```
     */
    minPowerKW?: number;

    /**
     * Maximum charging power for EV stations (in kilowatts).
     *
     * Filters EV charging stations to those with at least one connector
     * not exceeding the specified maximum power output.
     *
     * @remarks
     * **Use Cases:**
     * - Find charging compatible with vehicle's maximum charge rate
     * - Exclude ultra-fast chargers when not needed
     * - Filter by infrastructure capability
     *
     * **Closed Interval:**
     * Includes stations with exactly this power value.
     *
     * @example
     * ```typescript
     * // Level 2 charging only (up to 22kW)
     * maxPowerKW: 22
     *
     * // Moderate fast charging (up to 50kW)
     * maxPowerKW: 50
     *
     * // Power range 50-150 kW
     * minPowerKW: 50,
     * maxPowerKW: 150
     * ```
     */
    maxPowerKW?: number;
};
