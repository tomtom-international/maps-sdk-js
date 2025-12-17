import { bboxFromGeoJSON, PolygonFeature, PolygonFeatures } from '@tomtom-org/maps-sdk/core';
import { callService } from '../shared/serviceTemplate';
import type { ReachableRangeTemplate } from './reachableRangeTemplate';
import { reachableRangeTemplate } from './reachableRangeTemplate';
import type { ReachableRangeParams } from './types/reachableRangeParams';

/**
 * Calculate the area reachable from a starting point within given constraints.
 *
 * The Reachable Range service (also known as isochrone) computes a polygon representing
 * all locations that can be reached from an origin within specified limits of time, distance,
 * or energy consumption. This is essential for range analysis, service area visualization,
 * and logistics planning.
 *
 * @remarks
 * Key features:
 * - **Time-based ranges**: Areas reachable within a time budget (e.g., 30 minutes)
 * - **Distance-based ranges**: Areas within a distance limit (e.g., 50km)
 * - **Energy-based ranges**: EV range considering battery consumption
 * - **Traffic awareness**: Accounts for current and historic traffic patterns
 * - **Vehicle-specific**: Considers vehicle characteristics and constraints
 *
 * Common use cases:
 * - **Service area mapping**: "Show areas we can deliver to within 1 hour"
 * - **EV range visualization**: Display drivable range on current battery
 * - **Real estate**: "Find homes within 45 minutes of workplace"
 * - **Emergency services**: Calculate ambulance/fire truck response areas
 * - **Market analysis**: Identify customer catchment areas
 * - **Location planning**: Optimize facility placement based on coverage
 *
 * @param params Reachable range parameters including origin and budget constraints
 * @param customTemplate Advanced customization for request/response handling
 *
 * @returns Promise resolving to a polygon representing the reachable area
 *
 * @example
 * ```typescript
 * // Calculate 30-minute drive time range
 * const range30min = await calculateReachableRange({
 *   key: 'your-api-key',
 *   origin: [4.9041, 52.3676],  // Amsterdam
 *   timeBudgetInSec: 1800  // 30 minutes
 * });
 *
 * // Calculate 50km distance range
 * const range50km = await calculateReachableRange({
 *   key: 'your-api-key',
 *   origin: [4.9041, 52.3676],
 *   distanceBudgetInMeters: 50000
 * });
 *
 * // EV range based on battery
 * const evRange = await calculateReachableRange({
 *   key: 'your-api-key',
 *   origin: [4.9041, 52.3676],
 *   fuelBudgetInkWh: 20,  // Remaining battery
 *   vehicleEngineType: 'electric',
 *   constantSpeedConsumptionInkWhPerHundredkm: [[50, 8], [80, 12]]
 * });
 *
 * // Traffic-aware range at departure time
 * const morningRange = await calculateReachableRange({
 *   key: 'your-api-key',
 *   origin: [4.9041, 52.3676],
 *   timeBudgetInSec: 2700,  // 45 minutes
 *   departAt: new Date('2025-10-20T08:00:00Z')  // Rush hour
 * });
 * ```
 *
 * @see [Reachable Range API Documentation](https://docs.tomtom.com/routing-api/documentation/routing/calculate-reachable-range)
 * @see [Routing Quickstart Guide](https://docs.tomtom.com/maps-sdk-js/guides/services/routing/quickstart)
 *
 * @group Routing
 */
export const calculateReachableRange = async (
    params: ReachableRangeParams,
    customTemplate?: Partial<ReachableRangeTemplate>,
): Promise<PolygonFeature<ReachableRangeParams>> =>
    callService(params, { ...reachableRangeTemplate, ...customTemplate }, 'Reachable Range');

/**
 * Calculate multiple reachable range areas from different origins or with different constraints.
 *
 * Computes several isochrone polygons in sequence, useful for comparing ranges from multiple
 * locations, visualizing multiple time/distance rings from the same origin, or analyzing
 * different vehicle scenarios.
 *
 * @remarks
 * Use cases:
 * - **Multi-location comparison**: Compare service areas of different store locations
 * - **Concentric ranges**: Create 15/30/45 minute drive time rings from one origin
 * - **Scenario analysis**: Compare ranges for different vehicle types or times of day
 * - **Coverage optimization**: Find optimal facility locations with minimal overlap
 *
 * Note: Ranges are calculated sequentially to avoid rate limiting. For large batches,
 * consider implementing your own parallel processing with appropriate throttling.
 *
 * @param paramsArray Array of reachable range parameters, one for each area to calculate
 * @param customTemplate Advanced customization for request/response handling
 *
 * @returns Promise resolving to a FeatureCollection of reachable area polygons
 *
 * @example
 * ```typescript
 * // Calculate concentric drive time rings (15, 30, 45 minutes)
 * const timeRings = await calculateReachableRanges([
 *   { key: 'your-api-key', origin: [4.9, 52.3], timeBudgetInSec: 900 },
 *   { key: 'your-api-key', origin: [4.9, 52.3], timeBudgetInSec: 1800 },
 *   { key: 'your-api-key', origin: [4.9, 52.3], timeBudgetInSec: 2700 }
 * ]);
 *
 * // Compare service areas of multiple stores
 * const storeRanges = await calculateReachableRanges([
 *   { key: 'your-api-key', origin: [4.9, 52.3], timeBudgetInSec: 1800 },
 *   { key: 'your-api-key', origin: [4.5, 51.9], timeBudgetInSec: 1800 },
 *   { key: 'your-api-key', origin: [5.1, 52.1], timeBudgetInSec: 1800 }
 * ]);
 *
 * // Compare EV ranges at different battery levels
 * const batteryRanges = await calculateReachableRanges([
 *   {
 *     key: 'your-api-key',
 *     origin: [4.9, 52.3],
 *     fuelBudgetInkWh: 10,
 *     vehicleEngineType: 'electric'
 *   },
 *   {
 *     key: 'your-api-key',
 *     origin: [4.9, 52.3],
 *     fuelBudgetInkWh: 20,
 *     vehicleEngineType: 'electric'
 *   }
 * ]);
 * ```
 *
 * @see [Reachable Range API Documentation](https://docs.tomtom.com/routing-api/documentation/routing/calculate-reachable-range)
 * @see [Routing Quickstart Guide](https://docs.tomtom.com/maps-sdk-js/guides/services/routing/quickstart)
 *
 * @group Routing
 */
export const calculateReachableRanges = async (
    paramsArray: ReachableRangeParams[],
    customTemplate?: Partial<ReachableRangeTemplate>,
): Promise<PolygonFeatures<ReachableRangeParams>> => {
    const features = [];
    for (const params of paramsArray) {
        // we sequentially fetch reachable ranges (less speed but better to prevent QPS limit breaches):
        features.push(await calculateReachableRange(params, customTemplate));
    }
    const bbox = bboxFromGeoJSON(features);
    return { type: 'FeatureCollection', ...(bbox && { bbox }), features };
};
