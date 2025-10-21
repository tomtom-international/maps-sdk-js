import { callService } from '../shared/serviceTemplate';
import { calculateMatrixRouteTemplate } from './calculateMatrixRouteTemplate';
import type { CalculateMatrixRouteResponseAPI } from './types/apiResponseTypes';
import type { CalculateMatrixRouteParams } from './types/calculateMatrixRouteParams';

/**
 * Calculate travel times and distances between multiple origins and destinations.
 *
 * The Matrix Routing service computes optimal routes between sets of locations in a single request,
 * returning a matrix of travel times and distances. This is essential for optimization problems
 * like vehicle routing, delivery planning, and proximity analysis.
 *
 * @remarks
 * Key features:
 * - **Batch computation**: Calculate hundreds of routes in one request
 * - **Traffic awareness**: Incorporates real-time and historic traffic
 * - **Asymmetric results**: A→B may differ from B→A due to traffic/one-ways
 * - **Efficient**: Much faster than individual route requests
 *
 * Common use cases:
 * - **Delivery optimization**: Find optimal route for multiple stops
 * - **Service area analysis**: Calculate travel times from warehouses to customers
 * - **Proximity search**: Find nearest locations based on travel time
 * - **Logistics planning**: Optimize fleet assignments
 * - **Isochrone generation**: Create drive-time polygons
 *
 * Matrix dimensions:
 * - Maximum: 700 origins × destinations (e.g., 10×70, 25×28)
 * - For N-to-N: Maximum √700 ≈ 26 locations
 *
 * @param params - Matrix routing parameters with origins and destinations
 *
 * @returns Promise resolving to matrix of travel times and distances
 *
 * @example
 * ```typescript
 * // Calculate from one warehouse to multiple delivery addresses
 * const matrix = await calculateMatrixRoute({
 *   key: 'your-api-key',
 *   origins: [[4.9, 52.3]],  // Warehouse
 *   destinations: [
 *     [4.91, 52.31],  // Customer 1
 *     [4.88, 52.35],  // Customer 2
 *     [4.95, 52.28]   // Customer 3
 *   ]
 * });
 * // matrix[0][0] = warehouse to customer 1
 * // matrix[0][1] = warehouse to customer 2
 * // matrix[0][2] = warehouse to customer 3
 *
 * // Calculate between multiple stores
 * const stores = [
 *   [4.9, 52.3],
 *   [4.5, 51.9],
 *   [5.1, 52.1]
 * ];
 * const storeMatrix = await calculateMatrixRoute({
 *   key: 'your-api-key',
 *   origins: stores,
 *   destinations: stores,
 *   departAt: new Date('2025-10-20T08:00:00Z')
 * });
 *
 * // Find nearest store by travel time
 * const customerLocation = [4.85, 52.25];
 * const timesToStores = await calculateMatrixRoute({
 *   key: 'your-api-key',
 *   origins: [customerLocation],
 *   destinations: stores
 * });
 * const nearestStoreIndex = timesToStores.matrix[0]
 *   .reduce((minIdx, time, idx, arr) =>
 *     time.travelTimeInSeconds < arr[minIdx].travelTimeInSeconds ? idx : minIdx, 0
 *   );
 * ```
 *
 * @see [Matrix Routing API Documentation](https://docs.tomtom.com/routing-api/documentation/matrix-routing/matrix-routing-service)
 * @see [Routing Quickstart Guide](https://docs.tomtom.com/maps-sdk-js/guides/services/routing/quickstart)
 *
 * @group Matrix Routing
 */
export const calculateMatrixRoute = async (
    params: CalculateMatrixRouteParams,
): Promise<CalculateMatrixRouteResponseAPI> => callService(params, calculateMatrixRouteTemplate, 'MatrixRouting');
