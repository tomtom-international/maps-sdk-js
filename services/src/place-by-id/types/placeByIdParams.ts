import type { MapcodeType, OpeningHoursMode, View } from '@tomtom-org/maps-sdk-js/core';
import type { CommonServiceParams, RelatedPoisRequest, TimeZoneRequest } from '../../shared';
import type { PlaceByIdResponseAPI } from './placeByIdResponseAPI';

/**
 * Optional parameters for the Place by ID service.
 *
 * @group Place
 */
export type PlaceByIdOptionalParams = {
    /**
     * Enable comma-separated mapcodes list in the response.
     *
     * @remarks
     * Mapcodes are short location codes representing a specific location
     * to within a few meters. Can filter to show only selected mapcode types.
     *
     * **Mapcode Types:**
     * - `Local`: Short local codes for use within a territory
     * - `International`: Longer codes that work worldwide
     * - `Alternative`: Alternative codes for the same location
     *
     * @see [Mapcode Project](https://www.mapcode.com/)
     *
     * @example
     * ```typescript
     * mapcodes: ['Local', 'International']
     * ```
     */
    mapcodes?: MapcodeType[];

    /**
     * Geopolitical view context for disputed territories.
     *
     * @remarks
     * Determines how disputed territories are handled in the response.
     *
     * **Available Views:**
     * - `Unified`: International view (default)
     * - `AR`: Argentina
     * - `IN`: India
     * - `PK`: Pakistan
     * - `IL`: Israel
     * - `MA`: Morocco
     * - `RU`: Russia
     * - `TR`: Turkey
     * - `CN`: China
     *
     * @default 'Unified'
     *
     * @example
     * ```typescript
     * view: 'IN'  // Indian geopolitical view
     * ```
     */
    view?: View;

    /**
     * Include opening hours information in the response.
     *
     * @remarks
     * Provides operating hours for POIs (restaurants, stores, etc.).
     *
     * @example
     * ```typescript
     * openingHours: 'nextSevenDays'
     * ```
     */
    openingHours?: OpeningHoursMode;

    /**
     * Include timezone information in the response.
     *
     * @remarks
     * Returns the timezone of the place's location (e.g., "America/New_York").
     *
     * @example
     * ```typescript
     * timeZone: 'iana'
     * ```
     */
    timeZone?: TimeZoneRequest;

    /**
     * Include related Points of Interest in the response.
     *
     * @remarks
     * POIs can have parent/child relationships. For example, an airport terminal
     * is a child of the airport.
     *
     * **Relation Types:**
     * - `child`: Return POIs that are children of this place
     * - `parent`: Return POIs that are parents of this place
     * - `all`: Return both child and parent relations
     * - `off`: No related POIs (default)
     *
     * @default 'off'
     *
     * @example
     * ```typescript
     * relatedPois: 'child'  // Get terminals inside an airport
     * relatedPois: 'parent'  // Get the airport containing a terminal
     * relatedPois: 'all'  // Get all related POIs
     * ```
     */
    relatedPois?: RelatedPoisRequest;
};

/**
 * Mandatory parameters for the Place by ID service.
 *
 * @group Place
 */
export type PlaceByIdMandatoryParams = {
    /**
     * The unique POI identifier.
     *
     * @remarks
     * This ID can be obtained from:
     * - Previous search results (place.id)
     * - POI details data source (place.properties.dataSources.poiDetails.id)
     * - Related POIs (place.properties.relatedPois[].id)
     *
     * @example
     * ```typescript
     * entityId: '528009002822995'
     * ```
     */
    entityId: string;
};

/**
 * Parameters for the Place by ID service.
 *
 * Combines mandatory and optional parameters for fetching detailed information
 * about a specific place using its unique identifier.
 *
 * @remarks
 * Use this service to:
 * - Get detailed POI information
 * - Refresh cached place data
 * - Navigate between related POIs
 * - Fetch additional place properties not in search results
 *
 * @example
 * ```typescript
 * // Basic lookup
 * const params: PlaceByIdParams = {
 *   key: 'your-api-key',
 *   entityId: '528009002822995'
 * };
 *
 * // With additional information
 * const detailedParams: PlaceByIdParams = {
 *   key: 'your-api-key',
 *   entityId: '528009002822995',
 *   openingHours: 'nextSevenDays',
 *   mapcodes: ['Local'],
 *   relatedPois: 'child'
 * };
 * ```
 *
 * @group Place
 */
export type PlaceByIdParams = CommonServiceParams<URL, PlaceByIdResponseAPI> &
    PlaceByIdMandatoryParams &
    PlaceByIdOptionalParams;
