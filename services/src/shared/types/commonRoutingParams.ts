import type { Avoidable, TravelMode } from '@tomtom-org/maps-sdk/core';
import { VehicleParameters } from './vehicleParams';

/**
 * Basic low/normal/high intensity level option.
 *
 * Used for configuring route characteristics like hilliness or windingness.
 *
 * @remarks
 * - `low`: Minimal intensity
 * - `normal`: Moderate intensity
 * - `high`: Maximum intensity
 *
 * @group Routing
 */
export type LNH = 'low' | 'normal' | 'high';

// TODO: there is no slope data yet in Orbis, thus hilliness isn't supported yet
// /**
//  * Options applicable to the thrilling route type.
//  */
// export type ThrillingParams = {
//     /**
//      * The level of hilliness on a thrilling route.
//      * * Possible values: low, normal, high.
//      * * This parameter can only be used in conjunction with routeType thrilling.
//      * @default None
//      */
//     hilliness?: LNH;
//
//     /**
//      * The level of windingness on a thrilling route.
//      *
//      * * Possible values: low, normal, high.
//      * * This parameter can only be used in conjunction with routeType thrilling.
//      * @default None
//      */
//     windingness?: LNH;
// };

/**
 * Available route types, where each type specifies the type of optimization used when calculating routes:
 * * **fast**: Route calculation is optimized by travel time, while keeping the routes sensible. For example, the calculation may avoid shortcuts along inconvenient side roads or long detours that only save very little time.
 * * **short**: Route calculation is optimized such that a good compromise between small travel time and short travel distance is achieved.
 * * **efficient**: Route calculation is optimized such that a good compromise between small travel time and low fuel or energy consumption is achieved.
 * * **thrilling**: Route calculation is optimized such that routes include interesting or challenging roads and use as few motorways as possible.
 * There is a limit of 900km on routes planned with routeType=thrilling.
 *
 * @group Routing
 */
export const routeTypes = ['fast', 'short', 'efficient', 'thrilling'] as const;

/**
 * Route optimization strategy for route calculation.
 *
 * Determines what the routing engine optimizes for when calculating the route.
 * Each type produces different routes suited to different use cases.
 *
 * @remarks
 * **Route Type Strategies:**
 *
 * - **`fast`**: Minimize travel time while maintaining practicality
 *   - Prefers major roads and highways
 *   - Avoids unnecessary detours and shortcuts on minor roads
 *   - Best for most everyday use cases (commuting, business travel)
 *
 * - **`short`**: Balance between time and distance
 *   - Good compromise between speed and mileage
 *   - May use smaller roads to save distance
 *   - Useful for short trips or when fuel costs matter
 *
 * - **`efficient`**: Minimize fuel or energy consumption
 *   - Optimizes for least energy use
 *   - Considers vehicle consumption model
 *   - Avoids rapid acceleration/deceleration
 *   - Best used with vehicle consumption parameters
 *
 * - **`thrilling`**: Scenic and engaging routes
 *   - Prefers curvy, interesting roads
 *   - Minimizes motorway usage
 *   - **Limited to 900km maximum route length**
 *   - Ideal for motorcycle rides or scenic drives
 *
 * @example
 * ```typescript
 * // Fastest route for commuting
 * const routeType: RouteType = 'fast';
 *
 * // Most fuel-efficient route for long trip
 * const ecoRoute: RouteType = 'efficient';
 *
 * // Scenic route for leisure
 * const scenicRoute: RouteType = 'thrilling';
 * ```
 *
 * @group Routing
 */
export type RouteType = (typeof routeTypes)[number];

/**
 * Traffic consideration mode for route calculation.
 *
 * Controls how traffic conditions are factored into routing and travel time estimates.
 *
 * @remarks
 * **Traffic Modes:**
 *
 * - **`live`**: Real-time + historical traffic
 *   - Includes current traffic jams and incidents
 *   - Considers short-term and long-term road closures
 *   - Most accurate for immediate departures
 *   - Updates with current conditions
 *
 * - **`historical`**: Typical traffic patterns only
 *   - Based on historical data for time of day/week
 *   - Ignores current traffic conditions
 *   - Good for future trip planning
 *   - More predictable for scheduled departures
 *
 * @example
 * ```typescript
 * // Route considering current traffic (departing now)
 * const trafficMode: TrafficInput = 'live';
 *
 * // Route based on typical patterns (planning ahead)
 * const plannedRoute: TrafficInput = 'historical';
 * ```
 *
 * @group Routing
 */
export type TrafficInput = 'live' | 'historical';

/**
 * Cost model criteria for route optimization.
 *
 * Defines routing preferences and constraints that influence path selection.
 * Combines route type, traffic consideration, and avoidance criteria to determine
 * what makes a route "better" in the eyes of the routing engine.
 *
 * @remarks
 * The cost model balances multiple factors:
 * - Time efficiency
 * - Distance
 * - Fuel/energy consumption
 * - User preferences (avoid tolls, ferries, etc.)
 * - Traffic conditions
 *
 * @example
 * ```typescript
 * // Fast route avoiding tolls
 * const costModel: CostModel = {
 *   routeType: 'fast',
 *   traffic: 'live',
 *   avoid: ['tollRoads']
 * };
 *
 * // Eco-friendly route avoiding highways
 * const ecoCostModel: CostModel = {
 *   routeType: 'efficient',
 *   traffic: 'historical',
 *   avoid: ['motorways', 'ferries']
 * };
 *
 * // Scenic route for leisure
 * const scenicCostModel: CostModel = {
 *   routeType: 'thrilling',
 *   avoid: ['motorways', 'tollRoads']
 * };
 * ```
 *
 * @group Routing
 */
export type CostModel = {
    /**
     * Specifies something that the route calculation should try to avoid when determining the route.
     * @default None
     */
    avoid?: Avoidable[];

    /**
     * Decides how traffic is considered for computing routes.
     * Possible values are:
     * * live: In addition to historical travel times, routing and estimated travel time
     * consider traffic jams and short- and long-term closures during the travel time window.
     * * historical: Routing and estimated travel time consider historical travel times and long term closures.
     * Traffic jams and short-term closures during the travel time window do not influence routing or travel time.
     * @default live
     */
    traffic?: TrafficInput;

    /**
     * Specifies the type of optimization used when calculating routes.
     * Possible values are:
     *
     * * **fast**: Route calculation is optimized by travel time, while keeping the routes sensible. For example, the calculation may avoid shortcuts along inconvenient side roads or long detours that only save very little time.
     * * **short**: Route calculation is optimized such that a good compromise between small travel time and short travel distance is achieved.
     * * **efficient**: Route calculation is optimized such that a good compromise between small travel time and low fuel or energy consumption is achieved.
     * * **thrilling**: Route calculation is optimized such that routes include interesting or challenging roads and use as few motorways as possible.
     * There is a limit of 900km on routes planned with routeType=thrilling.
     * @default fast
     */
    routeType?: RouteType;

    /**
     * Optional parameters if the route type is "thrilling" to indicate how curvy and hilly the route should be.
     */
    // TODO not supported yet in Orbis (no slope data)
    // thrillingParams?: ThrillingParams;
};

type DepartArriveOption = 'departAt' | 'arriveBy';

/**
 * Departure or arrival time specification for route planning.
 *
 * Allows specifying either when to depart from the origin or when to arrive at the destination.
 * The routing engine calculates the route optimized for that specific time window, considering
 * traffic patterns for that time of day.
 *
 * @typeParam Option - Whether this specifies departure or arrival time
 *
 * @remarks
 * Traffic conditions vary significantly by:
 * - Time of day (rush hour vs off-peak)
 * - Day of week (weekday vs weekend)
 * - Special events or holidays
 *
 * Specifying a departure or arrival time enables the router to:
 * - Use appropriate traffic data for that time
 * - Plan around rush hour or quiet periods
 * - Calculate accurate arrival/departure times
 * - Account for time-dependent road restrictions
 *
 * **Important Notes:**
 * - Past dates will default to departing immediately
 * - Impossible dates (e.g., imminent arrival for long routes) default to departing now
 * - Times are processed in the timezone of the origin/destination
 *
 * @example
 * ```typescript
 * // Depart at specific time (morning commute)
 * const departParams: DepartArriveParams = {
 *   option: 'departAt',
 *   date: new Date('2025-10-20T08:00:00Z')
 * };
 *
 * // Arrive by specific time (catch a flight)
 * const arriveParams: DepartArriveParams = {
 *   option: 'arriveBy',
 *   date: new Date('2025-10-20T14:00:00Z')
 * };
 *
 * // Plan route avoiding rush hour
 * const offPeakDepart: DepartArriveParams = {
 *   option: 'departAt',
 *   date: new Date('2025-10-20T10:30:00Z')  // After morning rush
 * };
 * ```
 *
 * @group Routing
 */
export type DepartArriveParams<Option extends DepartArriveOption = DepartArriveOption> = {
    /**
     * Whether to specify a departure or arrival time.
     *
     * @remarks
     * - `departAt`: Calculate route from this departure time forward
     * - `arriveBy`: Calculate route backward to arrive by this time
     */
    option: Option;

    /**
     * The date and time to depart or arrive.
     *
     * @remarks
     * If past dates are supplied or dates that are impossible to achieve
     * (e.g., an imminent arrival date for a very long route), the system
     * will default to departing immediately.
     *
     * Times should be specified in ISO 8601 format or as JavaScript Date objects.
     */
    date: Date;
};

/**
 * Common parameters shared across all routing service requests.
 *
 * These parameters configure how routes are calculated, including optimization
 * strategy, vehicle characteristics, timing constraints, and travel preferences.
 * They provide a consistent interface across different routing services.
 *
 * @remarks
 * Most routing services (calculateRoute, calculateMatrixRoute, calculateReachableRange)
 * accept these parameters to customize route calculation. They control:
 * - What to optimize for (time, distance, fuel)
 * - Vehicle constraints and capabilities
 * - When to travel (affecting traffic)
 * - What features to avoid
 * - Mode of transportation
 *
 * **Service Compatibility:**
 * - {@link calculateRoute}: All parameters supported
 * - {@link calculateMatrixRoute}: Subset of parameters
 * - {@link calculateReachableRange}: Subset of parameters
 *
 * @example
 * ```typescript
 * // Standard car route avoiding tolls
 * const routingParams: CommonRoutingParams = {
 *   costModel: {
 *     routeType: 'fast',
 *     traffic: 'live',
 *     avoid: ['tollRoads']
 *   },
 *   travelMode: 'car',
 *   when: {
 *     option: 'departAt',
 *     date: new Date('2025-10-20T08:00:00Z')
 *   }
 * };
 *
 * // Electric vehicle route with consumption model
 * const evRoutingParams: CommonRoutingParams = {
 *   costModel: {
 *     routeType: 'efficient',
 *     traffic: 'live'
 *   },
 *   travelMode: 'car',
 *   vehicle: {
 *     engineType: 'electric',
 *     model: {
 *       dimensions: {
 *         weightKG: 2000
 *       },
 *       engine: {
 *         consumption: {
 *           speedToConsumption: [
 *             { speedKMH: 50, consumptionUnitsPer100KM: 15 },
 *             { speedKMH: 90, consumptionUnitsPer100KM: 18 },
 *             { speedKMH: 120, consumptionUnitsPer100KM: 22 }
 *           ]
 *         }
 *       }
 *     },
 *     state: {
 *       currentChargeInkWh: 60
 *     }
 *   }
 * };
 *
 * // Truck route with restrictions
 * const truckParams: CommonRoutingParams = {
 *   costModel: {
 *     routeType: 'short',
 *     avoid: ['tollRoads', 'ferries']
 *   },
 *   travelMode: 'truck',
 *   vehicle: {
 *     model: {
 *       dimensions: {
 *         lengthMeters: 16.5,
 *         widthMeters: 2.5,
 *         heightMeters: 4.0,
 *         weightKG: 40000
 *       },
 *       restrictions: {
 *         restrictions: {
 *           commercial: true,
 *           maxSpeedKMH: 90
 *         }
 *       }
 *     }
 *   }
 * };
 * ```
 *
 * @see [Common Routing Parameters Documentation](https://docs.tomtom.com/routing-api/documentation/routing/common-routing-parameters)
 *
 * @group Routing
 */
export type CommonRoutingParams = {
    /**
     * Criteria that specifies what paths to prefer during routing.
     */
    costModel?: CostModel;

    /**
     * The primary means of transportation to be used while routing.
     *
     * The travel mode for the requested route.
     * Note that the requested travelMode may not be available for the entire route. Where
     * the requested travelMode is not available for a particular section, the element of the
     * response for that section will be 'other'.
     * @default None
     */
    travelMode?: TravelMode;

    /**
     * Specifies when to depart or arrive.
     * If past dates are supplied or in a way that are impossible to achieve
     * (e.g. an imminent arrival date for a long route), then it will default to departing now.
     * @default depart now
     */
    when?: DepartArriveParams;

    /**
     * Parameters for the vehicle that will be used to drive the route.
     */
    vehicle?: VehicleParameters;

    /**
     * The version of the API to use.
     * * The SDK will use the right default when not specified.
     * * Use it only if you really need to target a specific API version.
     */
    apiVersion?: number;
};
