import type { TrafficAreaAnalytics } from '@tomtom-org/maps-sdk/core';
import { callService } from '../shared/serviceTemplate';
import type { TrafficAreaAnalyticsTemplate } from './trafficAreaAnalyticsTemplate';
import { trafficAreaAnalyticsTemplate } from './trafficAreaAnalyticsTemplate';
import type { TrafficAreaAnalyticsParams } from './types/trafficAreaAnalyticsParams';

/**
 * Run a synchronous traffic area analytics report for a polygon region.
 *
 * Submits a single Polygon region with a date range and requested metrics, and
 * receives the full analysis result immediately (no polling required).
 *
 * @remarks
 * **Lite report constraints:**
 * - Only a single region (Polygon Feature) may be submitted per request.
 * - The date range (`startDate` → `endDate`) must not exceed 31 days.
 *
 * **Key data returned per region:**
 * - `baseData`: overall aggregated metrics for the full analysis period
 * - `timedData`: time-series breakdown at yearly / monthly / weekly / daily / hourly granularity
 * - `tiledData`: per-tile heatmap metrics (when available)
 * - `anomalies`: detected traffic anomalies keyed by data type
 *
 * **Available metrics (`dataTypes`):**
 * - `SPEED` — average speed on the road network (km/h)
 * - `FREE_FLOW_SPEED` — average speed under uncongested conditions (km/h)
 * - `CONGESTION_LEVEL` — percentage increase in travel time above free-flow
 * - `TRAVEL_TIME` — average travel time per 10 km (minutes)
 * - `NETWORK_LENGTH` — total length of road segments with data (meters)
 *
 * @param params - Traffic Area Analytics parameters
 * @param customTemplate - Advanced customization for request/response handling
 *
 * @returns Promise resolving to a {@link TrafficAreaAnalytics} FeatureCollection
 *
 * @example
 * ```typescript
 * // Basic speed and congestion analysis for Amsterdam
 * const result = await trafficAreaAnalytics({
 *   startDate: new Date('2024-08-06'),
 *   endDate: new Date('2024-08-06'),
 *   functionalRoadClasses: ['MOTORWAY', 'MAJOR_ROAD', 'OTHER_MAJOR_ROAD', 'SECONDARY_ROAD', 'LOCAL_CONNECTING_ROAD', 'LOCAL_ROAD_HIGH_IMPORTANCE'],
 *   hours: [7, 8, 9, 17, 18],
 *   dataTypes: ['SPEED', 'CONGESTION_LEVEL'],
 *   geometry: {
 *     type: 'Polygon',
 *     coordinates: [
 *       [[4.896128, 52.382402], [4.875701, 52.368459], [4.923611, 52.36341], [4.896128, 52.382402]]
 *     ]
 *   }
 * });
 *
 * const region = result.features[0];
 * console.log(region.properties.baseData.speed);         // avg speed (km/h)
 * console.log(region.properties.baseData.congestionLevel); // congestion %
 * console.log(region.properties.timedData.hourly);       // hourly breakdown
 * ```
 *
 * @example
 * ```typescript
 * // Full metrics over a multi-day period
 * const result = await trafficAreaAnalytics({
 *   startDate: new Date('2024-08-01'),
 *   endDate: new Date('2024-08-07'),
 *   functionalRoadClasses: 'all',
 *   hours: 'all',
 *   dataTypes: ['SPEED', 'FREE_FLOW_SPEED', 'CONGESTION_LEVEL', 'TRAVEL_TIME', 'NETWORK_LENGTH'],
 *   geometry: {
 *     type: 'Polygon',
 *     coordinates: [[[4.89, 52.37], [4.91, 52.37], [4.91, 52.39], [4.89, 52.39], [4.89, 52.37]]]
 *   }
 * });
 *
 * result.features[0].properties.timedData.daily?.forEach(day => {
 *   console.log(day.date, day.congestionLevel);
 * });
 * ```
 *
 * @see [Area Analytics API Documentation](https://developer.tomtom.com/area-analytics/documentation/api/analysis-lite)
 *
 * @group Traffic
 */
export const trafficAreaAnalytics = async (
    params: TrafficAreaAnalyticsParams,
    customTemplate?: Partial<TrafficAreaAnalyticsTemplate>,
): Promise<TrafficAreaAnalytics> =>
    callService(params, { ...trafficAreaAnalyticsTemplate, ...customTemplate }, 'TrafficAreaAnalytics');
