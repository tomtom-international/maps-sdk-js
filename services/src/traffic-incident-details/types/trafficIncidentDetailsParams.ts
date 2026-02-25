import type { BBox, TrafficIncidentTimeValidity } from '@tomtom-org/maps-sdk/core';
import type { CommonServiceParams, FetchInput } from '../../shared';
import type { IncidentDetailsResponseAPI } from './apiTypes';

/**
 * @ignore
 */
type TrafficIncidentDetailsPostBody = { ids: string[] };

/**
 * @ignore
 */
type TrafficIncidentDetailsRequest = FetchInput<TrafficIncidentDetailsPostBody>;

/**
 * Base parameters shared by all Traffic Incident Details query modes.
 *
 * @group Traffic
 */
type TrafficIncidentDetailsBaseParams = CommonServiceParams<
    TrafficIncidentDetailsRequest,
    IncidentDetailsResponseAPI
> & {
    /**
     * Traffic Model ID used to obtain consistent traffic data.
     *
     * @remarks
     * The Traffic Model ID is obtained from the Traffic Flow service and
     * is valid for approximately 2 minutes. Using the same ID across
     * different traffic API calls ensures temporal consistency.
     *
     * @example
     * ```typescript
     * trafficModelId: '1234567890'
     * ```
     */
    trafficModelId?: string;

    /**
     * Filter results to specific incident categories.
     *
     * @remarks
     * Provide icon category integers to include. When omitted, all categories
     * are returned. Category codes:
     * - `0`: Unknown
     * - `1`: Accident
     * - `2`: Fog
     * - `3`: Dangerous Conditions
     * - `4`: Rain
     * - `5`: Ice / Frost
     * - `6`: Jam
     * - `7`: Lane Closed
     * - `8`: Road Closed
     * - `9`: Road Works
     * - `10`: Wind
     * - `11`: Flooding
     * - `14`: Broken Down Vehicle
     *
     * @example
     * ```typescript
     * // Only accidents and road closures
     * categoryFilter: [1, 8]
     * ```
     */
    categoryFilter?: number[];

    /**
     * Filter incidents by their temporal validity.
     *
     * @remarks
     * - `'present'`: Only return currently active incidents
     * - `'future'`: Only return scheduled or predicted incidents
     *
     * When omitted, only `'present'` incidents are returned.
     *
     * @example
     * ```typescript
     * // Include both present and future incidents
     * timeValidityFilter: ['present', 'future']
     * ```
     */
    timeValidityFilter?: TrafficIncidentTimeValidity[];
};

/**
 * Parameters for fetching incidents within a bounding box.
 *
 * @remarks
 * The bounding box must cover an area no larger than 10,000 km².
 * Coordinates follow GeoJSON order: `[minLon, minLat, maxLon, maxLat]`.
 *
 * @example
 * ```typescript
 * // Amsterdam area
 * const params: TrafficIncidentDetailsByBBoxParams = {
 *   bbox: [4.728, 52.278, 5.080, 52.479]
 * };
 * ```
 *
 * @group Traffic
 */
export type TrafficIncidentDetailsByBBoxParams = TrafficIncidentDetailsBaseParams & {
    /**
     * Bounding box to query for incidents.
     *
     * Format: `[minLon, minLat, maxLon, maxLat]` (GeoJSON order).
     * Maximum area: 10,000 km².
     */
    bbox: BBox;
    ids?: never;
};

/**
 * Parameters for fetching specific incidents by their IDs.
 *
 * The HTTP method is chosen automatically: GET for up to 5 IDs, POST for more.
 *
 * @example
 * ```typescript
 * // Up to 5 IDs — sent as GET
 * const params: TrafficIncidentDetailsByIdsParams = {
 *   ids: ['incident-id-1', 'incident-id-2']
 * };
 *
 * // More than 5 IDs — sent as POST automatically
 * const params: TrafficIncidentDetailsByIdsParams = {
 *   ids: manyIds
 * };
 * ```
 *
 * @group Traffic
 */
export type TrafficIncidentDetailsByIdsParams = TrafficIncidentDetailsBaseParams & {
    /**
     * List of incident IDs to fetch.
     *
     * @remarks
     * Up to 5 IDs are sent via GET; more than 5 are sent via POST (maximum 100).
     */
    ids: string[];
    bbox?: never;
};

/**
 * Parameters for the Traffic Incident Details service.
 *
 * Provide either a `bbox` to search within an area, or a list of `ids` to
 * look up specific incidents.
 *
 * @group Traffic
 */
export type TrafficIncidentDetailsParams = TrafficIncidentDetailsByBBoxParams | TrafficIncidentDetailsByIdsParams;
