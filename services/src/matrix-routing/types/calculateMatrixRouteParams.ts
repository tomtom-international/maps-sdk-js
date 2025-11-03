import type { HasLngLat } from '@tomtom-org/maps-sdk/core';
import type { CommonServiceParams, TrafficInput } from '../../shared';
import type { CalculateMatrixRouteRequestAPI } from './apiRequestTypes';
import type { CalculateMatrixRouteResponseAPI } from './apiResponseTypes';

/**
 * Road types that can be avoided in matrix routing.
 *
 * @remarks
 * Matrix routing supports avoiding:
 * - `tollRoads`: Roads that require payment
 * - `unpavedRoads`: Dirt roads, gravel roads, or other unpaved surfaces
 *
 * @example
 * ```typescript
 * const avoidTolls: MatrixRouteAvoidable = 'tollRoads';
 * const avoidUnpaved: MatrixRouteAvoidable = 'unpavedRoads';
 * // Use with the avoid parameter:
 * // avoid: ['tollRoads']
 * // avoid: ['tollRoads', 'unpavedRoads']
 * ```
 *
 * @group Matrix Routing
 */
type MatrixRouteAvoidable = 'tollRoads' | 'unpavedRoads';

/**
 * Options for customizing matrix route calculations.
 *
 * Controls routing behavior including departure time, travel mode, vehicle specifications,
 * and road types to avoid when calculating travel times and distances between multiple
 * origin-destination pairs.
 *
 * @remarks
 * **Matrix Routing Use Cases:**
 * - Fleet management and dispatch optimization
 * - Delivery route planning (multiple stops)
 * - Travel time analysis between multiple locations
 * - Service area coverage calculations
 * - Last-mile delivery optimization
 *
 * **Performance Note:**
 * Matrix routing calculates routes for all origin-destination pairs. With N origins
 * and M destinations, this results in N×M route calculations. Use judiciously with
 * large datasets.
 *
 * @example
 * ```typescript
 * // Basic options with departure time
 * const options: MatrixRouteOptions = {
 *   departAt: new Date('2025-10-20T08:00:00Z'),
 *   routeType: 'fastest',
 *   traffic: 'live'
 * };
 *
 * // Truck routing with restrictions
 * const truckOptions: MatrixRouteOptions = {
 *   travelMode: 'truck',
 *   vehicleWeight: 25000,  // kg
 *   vehicleLength: 12,     // meters
 *   vehicleHeight: 4,      // meters
 *   vehicleCommercial: true,
 *   avoid: ['tollRoads']
 * };
 *
 * // Pedestrian routing
 * const walkingOptions: MatrixRouteOptions = {
 *   travelMode: 'pedestrian',
 *   departAt: 'now'
 * };
 * ```
 *
 * @group Matrix Routing
 */
export type MatrixRouteOptions = {
    // TODO: make it more in tune with calculate-route parameters ('when', 'vehicle'...)
    /**
     * Departure time for the journey.
     *
     * @remarks
     * **Options:**
     * - `Date`: Specific departure date/time (considers traffic at that time)
     * - `'now'`: Current time (uses live traffic)
     * - `'any'`: Ignore time-dependent factors (uses historical averages)
     *
     * Affects traffic calculations and time-dependent restrictions (e.g., rush hour).
     *
     * @example
     * ```typescript
     * departAt: new Date('2025-10-20T08:00:00Z')  // Morning rush hour
     * departAt: 'now'                              // Current traffic
     * departAt: 'any'                              // No traffic consideration
     * ```
     */
    departAt?: Date | 'any' | 'now';

    /**
     * Desired arrival time for the journey.
     *
     * @remarks
     * Cannot be used simultaneously with `departAt`. The API will calculate
     * the necessary departure time to arrive at the specified time.
     *
     * @example
     * ```typescript
     * arriveAt: new Date('2025-10-20T17:00:00Z')  // Arrive by 5 PM
     * arriveAt: 'any'                              // No time constraint
     * ```
     */
    arriveAt?: Date | 'any';

    /**
     * Route optimization type.
     *
     * @remarks
     * Currently only 'fastest' is supported in matrix routing.
     * Routes are optimized for minimal travel time.
     *
     * @default 'fastest'
     */
    routeType?: 'fastest';

    /**
     * Whether to consider traffic in calculations.
     *
     * @remarks
     * **Options:**
     * - `true` or `'live'`: Use live traffic data (requires departAt or arriveAt)
     * - `'historical'`: Use historical traffic patterns
     * - `false`: Ignore traffic (free-flow speeds)
     *
     * Traffic consideration significantly affects accuracy for time-sensitive routing.
     *
     * @default true
     *
     * @example
     * ```typescript
     * traffic: 'live'        // Current traffic conditions
     * traffic: 'historical'  // Typical traffic patterns
     * traffic: false         // No traffic
     * ```
     */
    traffic?: TrafficInput;

    /**
     * Mode of travel.
     *
     * @remarks
     * **Modes:**
     * - `car`: Standard passenger car (default)
     * - `truck`: Commercial truck with size/weight restrictions
     * - `pedestrian`: Walking routes (ignores vehicle restrictions)
     *
     * Different modes consider different road types and restrictions.
     *
     * @default 'car'
     *
     * @example
     * ```typescript
     * travelMode: 'car'
     * travelMode: 'truck'      // Consider weight/height limits
     * travelMode: 'pedestrian' // Walking paths only
     * ```
     */
    travelMode?: 'car' | 'truck' | 'pedestrian';

    /**
     * Weight of the vehicle in kilograms.
     *
     * @remarks
     * Used to check weight restrictions on roads and bridges.
     * Particularly important for truck routing.
     *
     * **Typical Values:**
     * - Light truck: 3,500 kg
     * - Medium truck: 12,000 kg
     * - Heavy truck: 25,000+ kg
     *
     * @example
     * ```typescript
     * vehicleWeight: 3500   // Light truck
     * vehicleWeight: 25000  // Heavy truck
     * ```
     */
    vehicleWeight?: number;

    /**
     * Length of the vehicle in meters.
     *
     * @remarks
     * Used to avoid roads with length restrictions.
     *
     * @example
     * ```typescript
     * vehicleLength: 6   // Small truck
     * vehicleLength: 12  // Standard truck
     * ```
     */
    vehicleLength?: number;

    /**
     * Height of the vehicle in meters.
     *
     * @remarks
     * Used to avoid low bridges, tunnels, and overpasses.
     *
     * **Common Heights:**
     * - Standard car: ~1.5 m
     * - Van: ~2.5 m
     * - Truck: ~4 m
     *
     * @example
     * ```typescript
     * vehicleHeight: 2.5  // Van
     * vehicleHeight: 4.0  // Truck
     * ```
     */
    vehicleHeight?: number;

    /**
     * Width of the vehicle in meters.
     *
     * @remarks
     * Used to avoid narrow roads and passages.
     *
     * @example
     * ```typescript
     * vehicleWidth: 2.5  // Standard truck width
     * ```
     */
    vehicleWidth?: number;

    /**
     * Weight per axle in kilograms.
     *
     * @remarks
     * Used for roads with axle weight restrictions (often on older bridges).
     *
     * @example
     * ```typescript
     * vehicleAxleWeight: 9000  // 9 tonnes per axle
     * ```
     */
    vehicleAxleWeight?: number;

    /**
     * Maximum speed of the vehicle in km/h.
     *
     * @remarks
     * Limits the assumed travel speed even on roads with higher speed limits.
     * Useful for vehicles with speed governors.
     *
     * @example
     * ```typescript
     * vehicleMaxSpeed: 90  // Limited to 90 km/h
     * ```
     */
    vehicleMaxSpeed?: number;

    /**
     * Whether the vehicle is used for commercial purposes.
     *
     * @remarks
     * Commercial vehicles may face additional restrictions in some regions
     * (e.g., city center restrictions, time-based restrictions).
     *
     * @default false
     *
     * @example
     * ```typescript
     * vehicleCommercial: true  // Commercial vehicle
     * ```
     */
    vehicleCommercial?: boolean;

    /**
     * Road types to avoid in route calculations.
     *
     * @remarks
     * Specify which road types to exclude from all calculated routes.
     *
     * @example
     * ```typescript
     * avoid: ['tollRoads']              // Avoid toll roads
     * avoid: ['unpavedRoads']           // Avoid unpaved roads
     * avoid: ['tollRoads', 'unpavedRoads']  // Avoid both
     * ```
     */
    avoid?: MatrixRouteAvoidable[];
};

/**
 * Parameters for calculating a routing matrix.
 *
 * Computes travel times and distances between multiple origins and destinations
 * in a single request, returning a matrix of all possible routes.
 *
 * @remarks
 * **Key Features:**
 * - Batch computation of multiple routes
 * - Traffic-aware calculations
 * - Vehicle-specific routing
 * - Efficient for optimization problems
 *
 * **Matrix Dimensions:**
 * - Maximum: 700 origins × destinations total
 * - Examples: 10×70, 25×28, 1×700
 * - For N-to-N: Maximum ~26 locations (√700)
 *
 * **Use Cases:**
 * - Delivery route optimization
 * - Service area analysis
 * - Fleet assignment
 * - Travel time comparisons
 * - Distance matrix calculations
 *
 * @example
 * ```typescript
 * // One-to-many: warehouse to customers
 * const params: CalculateMatrixRouteParams = {
 *   key: 'your-api-key',
 *   origins: [[4.9, 52.3]],  // Warehouse
 *   destinations: [
 *     [4.91, 52.31],  // Customer 1
 *     [4.88, 52.35],  // Customer 2
 *     [4.95, 52.28]   // Customer 3
 *   ]
 * };
 *
 * // Many-to-many: between stores
 * const storeParams: CalculateMatrixRouteParams = {
 *   key: 'your-api-key',
 *   origins: [[4.9, 52.3], [4.5, 51.9], [5.1, 52.1]],
 *   destinations: [[4.9, 52.3], [4.5, 51.9], [5.1, 52.1]],
 *   options: {
 *     departAt: new Date('2025-10-20T08:00:00Z'),
 *     traffic: true
 *   }
 * };
 *
 * // Truck routing with restrictions
 * const truckParams: CalculateMatrixRouteParams = {
 *   key: 'your-api-key',
 *   origins: [[4.9, 52.3]],
 *   destinations: [[4.5, 51.9], [5.1, 52.1]],
 *   options: {
 *     travelMode: 'truck',
 *     vehicleWeight: 25000,
 *     vehicleHeight: 4,
 *     avoid: ['tollRoads']
 *   }
 * };
 * ```
 *
 * @group Matrix Routing
 */
export type CalculateMatrixRouteParams = CommonServiceParams<
    CalculateMatrixRouteRequestAPI,
    CalculateMatrixRouteResponseAPI
> & {
    /**
     * List of origin locations.
     *
     * Each origin will be routed to all destinations, creating one row
     * in the resulting matrix.
     *
     * @remarks
     * **Format:**
     * Can be provided as:
     * - Objects with `lon` and `lat` properties
     * - Arrays `[longitude, latitude]`
     *
     * **Constraints:**
     * - Non-empty list required
     * - origins × destinations ≤ 700
     *
     * @see [POST body fields](https://docs.tomtom.com/routing-api/documentation/matrix-routing-v2/synchronous-matrix#post-body-fields)
     *
     * @example
     * ```typescript
     * // Object format
     * origins: [
     *   { lon: 4.9, lat: 52.3 },
     *   { lon: 4.5, lat: 51.9 }
     * ]
     *
     * // Array format
     * origins: [
     *   [4.9, 52.3],
     *   [4.5, 51.9]
     * ]
     * ```
     */
    origins: HasLngLat[];

    /**
     * List of destination locations.
     *
     * Each destination will receive routes from all origins, creating one
     * column in the resulting matrix.
     *
     * @remarks
     * **Format:**
     * Can be provided as:
     * - Objects with `lon` and `lat` properties
     * - Arrays `[longitude, latitude]`
     *
     * **Constraints:**
     * - Non-empty list required
     * - origins × destinations ≤ 700
     *
     * @see [POST body fields](https://docs.tomtom.com/routing-api/documentation/matrix-routing-v2/synchronous-matrix#post-body-fields)
     *
     * @example
     * ```typescript
     * destinations: [
     *   [4.91, 52.31],
     *   [4.88, 52.35],
     *   [4.95, 52.28]
     * ]
     * ```
     */
    destinations: HasLngLat[];

    /**
     * Additional routing options.
     *
     * Controls departure time, travel mode, vehicle specifications, and avoidances.
     */
    options?: MatrixRouteOptions;
};
