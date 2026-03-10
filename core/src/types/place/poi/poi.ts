import type { TimeZone } from '../../timezone';
import type { POICategory } from './category';
import type { OpeningHours } from './openingHours';

/**
 * Point of Interest (POI) information.
 *
 * Contains detailed information about a place such as a business, landmark, or facility.
 * This data enriches basic place information with operational details and categorization.
 *
 * @example
 * ```typescript
 * const poi: POI = {
 *   name: 'Central Station Café',
 *   phone: '+31 20 123 4567',
 *   brands: ['Starbucks'],
 *   categories: ['CAFE'],
 *   localizedCategories: ['café'],
 *   url: 'https://example.com',
 *   openingHours: { mode: 'nextSevenDays', timeRanges: [...], alwaysOpenThisPeriod: false }
 * };
 * ```
 *
 * @group Place
 */
export type POI = {
    /**
     * Name of the point of interest.
     *
     * The primary display name, localized according to the request language.
     */
    name: string;
    /**
     * Contact phone number for the POI.
     *
     * Typically includes country code (e.g., '+31 20 123 4567').
     */
    phone?: string;
    /**
     * Brand names associated with this POI.
     *
     * For chain locations, identifies the brand (e.g., 'Starbucks', 'Shell', 'Marriott').
     */
    brands?: string[];
    /**
     * Website URL for the POI.
     *
     * Official website or online presence for the business or location.
     */
    url?: string;
    /**
     * Standardized category identifiers for the POI.
     *
     * Machine-readable category names from the {@link POICategory} enum (e.g., `'ITALIAN_RESTAURANT'`, `'GAS_STATION'`, `'HOTEL'`).
     * Use these for filtering, programmatic category matching, or mapping to icons.
     * Parsed from the numeric category IDs returned by the API.
     */
    categories: POICategory[];
    /**
     * Localized human-readable category names for the POI.
     *
     * Language-sensitive text descriptions of the POI categories as returned by the API
     * (e.g., `'italian'`, `'restaurant'`, `'gas station'`, `'hotel'`). Suitable for display in the UI.
     */
    localizedCategories: string[];
    /**
     * Operating hours information.
     *
     * Specifies when the POI is open, including daily schedules and special hours.
     * Useful for determining if a location is currently open or planning visits.
     */
    openingHours?: OpeningHours;
    /**
     * Time zone of the POI location.
     *
     * Used for interpreting opening hours and scheduling visits across time zones.
     */
    timeZone?: TimeZone;
};

/**
 * Reference to a related Point of Interest.
 *
 * Represents a parent-child relationship between POIs, such as:
 * - A restaurant inside a shopping mall
 * - A store within an airport terminal
 * - A department within a larger facility
 *
 * @example
 * ```typescript
 * const relatedPOI: RelatedPOI = {
 *   relationType: 'parent',  // This POI is inside a larger complex
 *   id: 'abc123def456'       // ID to fetch parent POI details
 * };
 * ```
 *
 * @group Place
 */
export type RelatedPOI = {
    /**
     * Type of relationship between this POI and the referenced POI.
     *
     * - `child`: The referenced POI is contained within this POI (e.g., a store in this mall)
     * - `parent`: This POI is contained within the referenced POI (e.g., this store is inside a mall)
     */
    relationType: 'child' | 'parent';
    /**
     * Unique identifier for the related POI.
     *
     * Pass this ID to the Place by ID service to fetch detailed information
     * about the related location.
     */
    id: string;
};
