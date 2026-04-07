import type { AreaAnalyticsMetricKey } from '@tomtom-org/maps-sdk/core';
import type { MultiPolygon, Polygon } from 'geojson';
import type { CommonServiceParams } from '../../shared';

// ---------------------------------------------------------------------------
// Functional Road Classes
// ---------------------------------------------------------------------------

/**
 * Ordered list of Functional Road Class identifiers, from highest importance (motorways) to lowest.
 *
 * @remarks
 * The index of each class in this array corresponds to its FRC value in the API (0 for 'MOTORWAY', 1 for 'MAJOR_ROAD', ..., 8 for 'OTHER_ROAD').
 *
 * @see https://docs.tomtom.com/traffic-stats/documentation/product-information/faq#what-are-functional-road-classes-frc
 *
 * @group Traffic
 */
export const functionalRoadClasses = [
    'MOTORWAY',
    'MAJOR_ROAD',
    'OTHER_MAJOR_ROAD',
    'SECONDARY_ROAD',
    'LOCAL_CONNECTING_ROAD',
    'LOCAL_ROAD_HIGH_IMPORTANCE',
    'LOCAL_ROAD',
    'LOCAL_ROAD_MINOR_IMPORTANCE',
    'OTHER_ROAD',
] as const;

/**
 * A Functional Road Class (FRC) identifier — classifies road segments by their importance
 * in the road network.
 *
 * | Value | Description |
 * |---|---|
 * | `'MOTORWAY'` | Motorways, freeways, and major roads |
 * | `'MAJOR_ROAD'` | Major roads, less important than motorways |
 * | `'OTHER_MAJOR_ROAD'` | Other major roads connecting neighbouring regions |
 * | `'SECONDARY_ROAD'` | Secondary roads linking parts of the same region |
 * | `'LOCAL_CONNECTING_ROAD'` | Local roads providing settlement access |
 * | `'LOCAL_ROAD_HIGH_IMPORTANCE'` | Local roads of high importance within a settlement |
 * | `'LOCAL_ROAD'` | Local roads within settlement sections |
 * | `'LOCAL_ROAD_MINOR_IMPORTANCE'` | Local roads of minor importance (dead-ends, alleys) |
 * | `'OTHER_ROAD'` | Other roads (paths, cycle routes, pedestrian infrastructure) |
 *
 * @group Traffic
 */
export type FunctionalRoadClass = (typeof functionalRoadClasses)[number];

// ---------------------------------------------------------------------------
// Metric keys
// ---------------------------------------------------------------------------

/**
 * Maps a camelCase {@link AreaAnalyticsMetricKey} to the UPPER_CASE string expected by the API.
 *
 * @internal
 */
export const metricKeyToApiDataType: Record<AreaAnalyticsMetricKey, string> = {
    speed: 'SPEED',
    freeFlowSpeed: 'FREE_FLOW_SPEED',
    congestionLevel: 'CONGESTION_LEVEL',
    travelTime: 'TRAVEL_TIME',
    networkLength: 'NETWORK_LENGTH',
};

// ---------------------------------------------------------------------------
// Date input
// ---------------------------------------------------------------------------

/**
 * A date value accepted by Traffic Area Analytics — either a `Date` object or
 * an ISO `'YYYY-MM-DD'` string.
 * `Date` objects are automatically converted to `YYYY-MM-DD` format before
 * being sent to the API.
 *
 * @group Traffic
 */
export type AreaAnalyticsDateInput = string | Date;

// ---------------------------------------------------------------------------
// Date selection — exactly one variant must be supplied
// ---------------------------------------------------------------------------

/**
 * Continuous date-range variant: analyse traffic between `startDate` and `endDate`.
 *
 * - `endDate` is optional; when omitted it defaults to **today**.
 * - The range must not exceed **31 days**.
 * - Mutually exclusive with {@link TrafficAreaAnalyticsDays}.
 *
 * @group Traffic
 */
export type TrafficAreaAnalyticsDateRange = {
    /**
     * Start date of the analysis period.
     * Accepts a `Date` object or an ISO `'YYYY-MM-DD'` string.
     *
     * @example '2024-08-01'
     * @example new Date('2024-08-01')
     */
    startDate: AreaAnalyticsDateInput;

    /**
     * End date of the analysis period (inclusive).
     * Accepts a `Date` object or an ISO `'YYYY-MM-DD'` string.
     * When omitted, defaults to **today**.
     *
     * @remarks Must be within 31 days from `startDate`.
     *
     * @example '2024-08-07'
     * @example new Date('2024-08-07')
     */
    endDate?: AreaAnalyticsDateInput;

    days?: never;
};

/**
 * Specific-dates variant: analyse traffic on an explicit list of dates.
 *
 * Useful for non-consecutive dates such as "all Mondays in August".
 * Mutually exclusive with {@link TrafficAreaAnalyticsDateRange}.
 *
 * @group Traffic
 */
export type TrafficAreaAnalyticsDays = {
    /**
     * List of specific dates to include in the analysis.
     * Accepts `Date` objects or ISO `'YYYY-MM-DD'` strings.
     *
     * @example ['2024-08-05', '2024-08-12', '2024-08-19', '2024-08-26']
     */
    days: AreaAnalyticsDateInput[];

    startDate?: never;
    endDate?: never;
};

// ---------------------------------------------------------------------------
// Main params type
// ---------------------------------------------------------------------------

/**
 * Parameters for the Traffic Area Analytics Lite service.
 *
 * @remarks
 * Supply **either** `startDate` (+ optional `endDate`) **or** `days` — these
 * two options are mutually exclusive.
 *
 * The lite endpoint runs analysis synchronously and returns results immediately,
 * with the constraint that the date range must not exceed 31 days and only a
 * single region may be submitted.
 *
 * @example
 * ```typescript
 * // Continuous range — endDate defaults to today when omitted
 * const result = await trafficAreaAnalytics({
 *   startDate: '2024-08-01',
 *   functionalRoadClasses: ['MOTORWAY', 'MAJOR_ROAD', 'OTHER_MAJOR_ROAD', 'SECONDARY_ROAD', 'LOCAL_CONNECTING_ROAD', 'LOCAL_ROAD_HIGH_IMPORTANCE'],
 *   hours: [7, 8, 9, 17, 18],
 *   metrics: ['speed', 'congestionLevel'],
 *   geometry: {
 *     type: 'Polygon',
 *     coordinates: [[[4.896128, 52.382402], [4.875701, 52.368459], [4.923611, 52.36341], [4.896128, 52.382402]]]
 *   }
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Specific dates
 * const result = await trafficAreaAnalytics({
 *   days: ['2024-08-05', '2024-08-12', '2024-08-19', '2024-08-26'],
 *   functionalRoadClasses: ['MOTORWAY', 'MAJOR_ROAD', 'OTHER_MAJOR_ROAD'],
 *   hours: [8, 9, 17, 18],
 *   metrics: ['speed'],
 *   geometry: polygon
 * });
 * ```
 *
 * @group Traffic
 */
export type TrafficAreaAnalyticsParams = CommonServiceParams &
    TrafficAreaAnalyticsBaseParams &
    (TrafficAreaAnalyticsDateRange | TrafficAreaAnalyticsDays);

/**
 * @ignore
 */
type TrafficAreaAnalyticsBaseParams = {
    /**
     * Optional name for the analysis report.
     */
    name?: string;

    /**
     * Traffic metrics to include in the analysis, or `'all'` to include every metric.
     *
     * @remarks
     * At least one metric must be provided, or pass `'all'` as a shorthand for all five metrics.
     *
     * @example ['speed', 'congestionLevel', 'freeFlowSpeed']
     * @example 'all'
     */
    metrics: AreaAnalyticsMetricKey[] | 'all';

    /**
     * Functional road classes to include in the analysis, or `'all'` to include every class.
     *
     * @remarks
     * At least one value must be provided, or pass `'all'` as a shorthand for all nine classes.
     *
     * @example ['MOTORWAY', 'MAJOR_ROAD', 'OTHER_MAJOR_ROAD']
     * @example 'all'
     */
    functionalRoadClasses: FunctionalRoadClass[] | 'all';

    /**
     * Hours of the day to include in the analysis (0–23), or `'all'` to include every hour.
     *
     * @remarks
     * Provide at least one hour, or pass `'all'` as a shorthand for `[0, 1, 2, ..., 23]`.
     *
     * @example [7, 8, 9, 17, 18]
     * @example 'all'
     */
    hours: number[] | 'all';

    /**
     * The GeoJSON Polygon or MultiPolygon geometry defining the analysis region.
     *
     * @remarks
     * The lite endpoint accepts exactly one region. For multi-region analysis,
     * use the standard (async) report creation endpoint.
     */
    geometry: Polygon | MultiPolygon;
};
