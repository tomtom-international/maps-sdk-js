import type { BBox } from '@tomtom-org/maps-sdk/core';
import type { Feature, Polygon, Position } from 'geojson';

/**
 * Min/max value range for a single traffic metric across all tiles.
 *
 * @group Traffic
 */
export type AreaAnalyticsMetricRange = {
    min: number;
    max: number;
};

/**
 * All traffic metric identifiers, ordered consistently across the SDK.
 *
 * @group Traffic
 */
export const areaAnalyticsMetricKeys = [
    'speed',
    'freeFlowSpeed',
    'congestionLevel',
    'travelTime',
    'networkLength',
] as const;

/**
 * Identifies a single traffic metric — a key of {@link AreaAnalyticsMetrics}.
 *
 * @group Traffic
 */
export type AreaAnalyticsMetricKey = (typeof areaAnalyticsMetricKeys)[number];

/**
 * Traffic metric values for an area or time period.
 *
 * @remarks
 * All fields are optional — only metrics included in the requested `metrics` will be present.
 *
 * @group Traffic
 */
export type AreaAnalyticsMetrics = {
    /**
     * Average speed on the road network (km/h).
     */
    speed?: number;

    /**
     * Average free-flow speed based on static factors (km/h).
     * Represents the speed under ideal, uncongested conditions.
     */
    freeFlowSpeed?: number;

    /**
     * Average congestion level as a percentage increase in travel time
     * above free-flow conditions.
     */
    congestionLevel?: number;

    /**
     * Average travel time per 10 km (minutes).
     */
    travelTime?: number;

    /**
     * Sum of all road network segments with available data (meters).
     */
    networkLength?: number;
};

/**
 * A single time-series data entry with temporal identifiers and metric values.
 *
 * @remarks
 * The identifiers present depend on the granularity:
 * - `yearly`: `year`
 * - `monthly`: `year`, `month`
 * - `weekly`: `year`, `week`
 * - `daily`: `date`
 * - `hourly`: `date`, `hour`
 * - `average`: `day`, `hour` (weekly pattern by day-of-week and hour)
 *
 * @group Traffic
 */
export type AreaAnalyticsTimedEntry = AreaAnalyticsMetrics & {
    /**
     * Date for daily and hourly entries.
     */
    date?: Date;
    /**
     * Calendar year (e.g. 2024) for yearly, monthly, and weekly entries.
     */
    year?: number;
    /**
     * Calendar month (1–12) for monthly entries.
     */
    month?: number;
    /**
     * ISO week number for weekly entries.
     */
    week?: number;
    /**
     * Hour of the day (0–23) for hourly and average entries.
     */
    hour?: number;
    /**
     * Day of the week (1 = Monday … 7 = Sunday) for average entries.
     */
    day?: number;
};

/**
 * Time-series traffic data organized by granularity level.
 *
 * @group Traffic
 */
export type AreaAnalyticsTimedData = {
    /**
     * Yearly aggregated data.
     */
    yearly?: AreaAnalyticsTimedEntry[];
    /**
     * Monthly aggregated data.
     */
    monthly?: AreaAnalyticsTimedEntry[];
    /**
     * Weekly aggregated data.
     */
    weekly?: AreaAnalyticsTimedEntry[];
    /**
     * Daily aggregated data.
     */
    daily?: AreaAnalyticsTimedEntry[];
    /**
     * Hourly aggregated data.
     */
    hourly?: AreaAnalyticsTimedEntry[];
    /**
     * Average weekly traffic pattern organized by day-of-week and hour.
     */
    average?: AreaAnalyticsTimedEntry[];
};

/**
 * Traffic metrics for a single geographic tile within the analysis region.
 *
 * @remarks
 * All fields are optional — only metrics included in the requested `metrics` will be present.
 * `networkLength` here represents the total length of road segments **within that tile** (meters),
 * not the region aggregate.
 *
 * @group Traffic
 */
export type AreaAnalyticsTileEntry = AreaAnalyticsMetrics & {
    /**
     * Centre of the tile as a GeoJSON position `[longitude, latitude]`.
     */
    tileCentre: Position;
};

/**
 * A detected anomaly for a specific data type within the analysis period.
 *
 * @group Traffic
 */
export type AreaAnalyticsAnomaly = {
    /**
     * Start of the anomaly period.
     */
    startDate: Date;
    /**
     * End of the anomaly period.
     */
    endDate: Date;
    /**
     * Labels describing the anomaly (e.g. `'Holiday'`, `'Weather event'`).
     */
    labels: string[];
};

/**
 * Properties attached to each region feature in an area analytics result.
 *
 * @group Traffic
 */
export type AreaAnalyticsFeatureProperties = {
    /**
     * Name of the analysis region.
     */
    name: string;
    /**
     * IANA timezone identifier for the region (e.g. `'Europe/Amsterdam'`).
     */
    timezone: string;
    /**
     * Hierarchical level of the region in the analysis.
     */
    level: number;
    /**
     * Overall aggregated traffic metrics for the full analysis period.
     */
    baseData: AreaAnalyticsMetrics;
    /**
     * Traffic metrics broken down by time granularity.
     */
    timedData: AreaAnalyticsTimedData;
    /**
     * Per-tile traffic metrics for the region, if heatmap data was requested.
     */
    tiledData?: {
        tiles: AreaAnalyticsTileEntry[];
    };
    /**
     * Detected anomalies keyed by metric, if anomaly detection was performed.
     */
    anomalies?: Partial<Record<AreaAnalyticsMetricKey, AreaAnalyticsAnomaly[]>>;
};

/**
 * A single region feature in the area analytics result.
 *
 * @group Traffic
 */
export type AreaAnalyticsFeature = Omit<Feature<Polygon, AreaAnalyticsFeatureProperties>, 'id' | 'bbox'> & {
    /**
     * Unique identifier for this feature.
     */
    id: string;

    /**
     * Bounding box for this area analytics feature.
     */
    bbox: BBox;
};

/**
 * Metadata for the area analytics result collection.
 *
 * @group Traffic Analytics
 */
export type AreaAnalyticsCollectionProperties = {
    /**
     * Start of the analysis period.
     */
    startDate: Date;
    /**
     * End of the analysis period.
     */
    endDate: Date;
    /**
     * Traffic metrics included in the report.
     */
    metrics: AreaAnalyticsMetricKey[];
    /**
     * Whether tile-level heatmap data is included.
     */
    heatmap: boolean;
    /**
     * Functional road classes included in the analysis (0–8).
     */
    frcs: number[];
    /**
     * Data-driven min/max value ranges computed from all tile entries.
     * Only metrics present in the tile data will have a range entry.
     */
    ranges: Partial<Record<AreaAnalyticsMetricKey, AreaAnalyticsMetricRange>>;
};

/**
 * Result from the Traffic Area Analytics Lite service.
 *
 * Contains the full traffic analysis for the requested polygon region and time period.
 * Each feature corresponds to the submitted region with aggregated and time-series metrics.
 *
 * @example
 * ```typescript
 * const result = await trafficAreaAnalytics({
 *   startDate: new Date('2024-08-06'),
 *   endDate: new Date('2024-08-06'),
 *   frcs: [0, 1, 2, 3],
 *   hours: [7, 8, 9],
 *   metrics: ['speed', 'congestionLevel'],
 *   feature: {
 *     type: 'Feature',
 *     geometry: {
 *       type: 'Polygon',
 *       coordinates: [[[4.89, 52.37], [4.91, 52.37], [4.91, 52.39], [4.89, 52.39], [4.89, 52.37]]]
 *     },
 *     properties: {}
 *   }
 * });
 *
 * console.log(result.properties.startDate); // Date object: 2024-08-06T00:00:00.000Z
 * result.features[0].properties.baseData.speed; // avg speed in km/h
 * result.properties.ranges.congestionLevel; // { min: 3, max: 42 } — data-driven range across all tiles
 * ```
 *
 * @group Traffic
 */
export type TrafficAreaAnalytics = {
    type: 'FeatureCollection';
    /**
     * Collection-level metadata for the analysis.
     */
    properties: AreaAnalyticsCollectionProperties;
    /**
     * Analysis results, one feature per submitted region.
     */
    features: AreaAnalyticsFeature[];
};
