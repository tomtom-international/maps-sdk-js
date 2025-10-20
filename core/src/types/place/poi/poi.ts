import type { TimeZone } from '../../timezone';
import type { Classification } from './classification';
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
 *   categoryIds: [7315025],
 *   categories: ['Café'],
 *   url: 'https://example.com',
 *   openingHours: { mode: 'nextSevenDays', timeRanges: [...], alwaysOpenThisPeriod: false }
 * };
 * ```
 *
 * @group Place
 * @category Types
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
     * Category identifiers for the POI.
     *
     * Numeric IDs corresponding to the POI category classification system.
     * Use these for filtering or identifying POI types programmatically.
     */
    categoryIds?: number[];
    /**
     * Human-readable category names for the POI.
     *
     * Localized text descriptions of the POI categories (e.g., 'Restaurant', 'Gas Station', 'Hotel').
     */
    categories?: string[];
    /**
     * Operating hours information.
     *
     * Specifies when the POI is open, including daily schedules and special hours.
     * Useful for determining if a location is currently open or planning visits.
     */
    openingHours?: OpeningHours;
    /**
     * Detailed category classifications with localized names.
     *
     * Provides category information in multiple languages and includes standardized codes.
     */
    classifications?: Classification[];
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
 * @category Types
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
