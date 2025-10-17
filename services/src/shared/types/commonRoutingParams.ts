import type { Avoidable, TravelMode } from '@cet/maps-sdk-js/core';
import { VehicleParameters } from './vehicleParams';

/**
 * Basic low/normal/high option.
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
 */
export const routeTypes = ['fast', 'short', 'efficient', 'thrilling'] as const;

/**
 * Specifies the type of optimization used when calculating routes.
 * Possible values are:
 *
 * * **fast**: Route calculation is optimized by travel time, while keeping the routes sensible. For example, the calculation may avoid shortcuts along inconvenient side roads or long detours that only save very little time.
 * * **short**: Route calculation is optimized such that a good compromise between small travel time and short travel distance is achieved.
 * * **efficient**: Route calculation is optimized such that a good compromise between small travel time and low fuel or energy consumption is achieved.
 * * **thrilling**: Route calculation is optimized such that routes include interesting or challenging roads and use as few motorways as possible.
 * There is a limit of 900km on routes planned with routeType=thrilling.
 */
export type RouteType = (typeof routeTypes)[number];

/**
 * Decides how traffic is considered for computing routes.
 * Possible values are:
 * * live: In addition to historical travel times, routing and estimated travel time
 * consider traffic jams and short- and long-term closures during the travel time window.
 * * historical: Routing and estimated travel time consider historical travel times and long term closures.
 * Traffic jams and short-term closures during the travel time window do not influence routing or travel time.
 */
export type TrafficInput = 'live' | 'historical';

/**
 * Criteria that specifies what paths to prefer during routing.
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
 * Specifies when to depart (start traveling) or to arrive (finish traveling).
 */
export type DepartArriveParams<Option extends DepartArriveOption = DepartArriveOption> = {
    /**
     * Whether to specify a departure or arrive time (when allowed).
     */
    option: Option;
    /**
     * The date and time to depart or arrive.
     */
    date: Date;
};

/**
 * @see https://docs.tomtom.com/routing-api/documentation/routing/common-routing-parameters
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
