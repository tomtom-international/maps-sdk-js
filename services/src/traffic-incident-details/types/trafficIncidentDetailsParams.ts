import type { HasBBox, TrafficIncidentRequestCategory, TrafficIncidentTimeValidity } from '@tomtom-org/maps-sdk/core';
import type { CommonServiceParams } from '../../shared';

/**
 * Base parameters shared by all Traffic Incident Details query modes.
 *
 * @group Traffic
 */
type TrafficIncidentDetailsBaseParams = CommonServiceParams & {
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
     * Provide {@link TrafficIncidentRequestCategory} values to include. When omitted,
     * all filterable categories are returned. `'animals-on-road'` and `'narrow-lanes'`
     * are intentionally not accepted here — the upstream API documents them as
     * response-only and rejects the whole filter when they appear.
     *
     * @example
     * ```typescript
     * // Only accidents and road closures
     * categoryFilter: ['accident', 'road-closed']
     * ```
     */
    categoryFilter?: TrafficIncidentRequestCategory[];

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
 *
 * @example
 * ```typescript
 * // Raw bbox tuple
 * const params: TrafficIncidentDetailsByBBoxParams = {
 *   bbox: [4.728, 52.278, 5.080, 52.479]
 * };
 *
 * // GeoJSON place returned by geocoding
 * const place = await geocodeOne('Amsterdam');
 * const params: TrafficIncidentDetailsByBBoxParams = { bbox: place };
 * ```
 *
 * @group Traffic
 */
export type TrafficIncidentDetailsByBBoxParams = TrafficIncidentDetailsBaseParams & {
    /**
     * Bounding box to query for incidents.
     *
     * Accepts a raw `[minLon, minLat, maxLon, maxLat]` tuple, any GeoJSON object
     * (Feature, FeatureCollection, Geometry, …), or an array of GeoJSON objects.
     * When a GeoJSON value is provided, its bounding box is calculated automatically
     * via {@link bboxFromGeoJSON}.
     *
     * Maximum area: 10,000 km².
     *
     * @example
     * ```typescript
     * // Raw bbox tuple
     * bbox: [4.728, 52.278, 5.080, 52.479]
     *
     * // GeoJSON Feature returned by a geocode call
     * const place = await geocodeOne('Amsterdam');
     * bbox: place
     * ```
     */
    bbox: HasBBox;
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
